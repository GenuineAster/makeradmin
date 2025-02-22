from collections import defaultdict
from datetime import timedelta, datetime
from random import randint
import logging

from sqlalchemy import desc
from sqlalchemy.orm.exc import NoResultFound

from membership.models import PhoneNumberChangeRequest, normalise_phone_number
from multiaccessy.invite import ensure_accessy_labaccess, AccessyError
from service.db import db_session
from service.error import NotFound, BadRequest
from dispatch_sms import send_validation_code

logger = logging.getLogger('makeradmin')


def change_phone_request(member_id, phone):
    now = datetime.utcnow()

    try:
        phone = normalise_phone_number(phone)
    except ValueError:
        raise BadRequest("Inte ett bra telefonnummer.")

    # Limit total number of requests in a month
    total_requests = db_session.query(PhoneNumberChangeRequest).filter(PhoneNumberChangeRequest.timestamp >= now-timedelta(days=30)).count()
    if total_requests > 1024:
        logging.info(f'member id {member_id} channge phone number request, too many total requests ({total_requests}) last 30 days')
        raise BadRequest("Makerspace sms-quota är slut, prova igen om några dagar.")

    # Limit tries for a member in a month
    member_requests = db_session.query(PhoneNumberChangeRequest).filter(
        PhoneNumberChangeRequest.member_id == member_id, PhoneNumberChangeRequest.timestamp >= now-timedelta(days=30)
    ).count()
    if member_requests > 10:
        logging.info(f'member id {member_id} channge phone number request, too many requests lately')
        raise BadRequest("För många ändringsförsök, testa igen om några veckor.")

    # Limit changes for a member in a month
    success_requests = db_session.query(PhoneNumberChangeRequest).filter(
        PhoneNumberChangeRequest.member_id == member_id, PhoneNumberChangeRequest.completed, PhoneNumberChangeRequest.timestamp >= now-timedelta(days=30)
    ).count()
    if success_requests > 1:
        logging.info(f'member id {member_id} channge phone number request, too many changes lately')
        raise BadRequest("För många ändringar av numret, testa igen om några veckor.")

    validation_code = randint(0, 999_999)

    try:
        send_validation_code(phone, validation_code)
        logging.info(f'member id {member_id} change phone number request, sms sent, phone {phone}, code {validation_code}')
    except Exception as e:
        raise BadRequest("Misslyckades med att skicka sms med verifikations kod.")

    change_request = PhoneNumberChangeRequest(member_id=member_id, phone=phone, validation_code=validation_code,
                                              completed=False, timestamp=datetime.utcnow())

    db_session.add(change_request)
    db_session.flush()

    request_count = db_session.query(PhoneNumberChangeRequest).filter(PhoneNumberChangeRequest.member_id == member_id, PhoneNumberChangeRequest.phone == phone).count()
    return {"phone": phone, "request_count": request_count}


def change_phone_validate(member_id, validation_code):
    logging.info(f'member {member_id} validating phone number, code {validation_code}')
    now = datetime.utcnow()
    
    try:
        change_request = db_session.query(PhoneNumberChangeRequest).filter(
            PhoneNumberChangeRequest.member_id == member_id,
        ).order_by(desc(PhoneNumberChangeRequest.timestamp)).first()

        if inc_tries(member_id) > 1000:
            logging.info(f'member id {member_id} validating phone number, too many tries, aborting')
            raise BadRequest("Du har gissat för många gånger, block!")
        
        if change_request.completed:
            logging.info(f'member id {member_id} validating phone number, code already completed, code {validation_code}')
            raise BadRequest("Koden är redan använd")

        if change_request.validation_code == validation_code and change_request.timestamp <= now-timedelta(minutes=8):
            logging.info(f'member id {member_id} validating phone number, too old request, code {validation_code}')
            raise BadRequest("Koden är gammal")
        
        if change_request.validation_code == validation_code:
            change_request.member.phone = change_request.phone
            change_request.completed = True
            db_session.flush()
            logging.info(f'member id {member_id} validating phone number, success, changed phone number to {change_request.phone}')
            
            try:
                ensure_accessy_labaccess(member_id)
            except AccessyError as e:
                logger.warning(f"failed to ensure accessy labacess after changing phone number, skipping, member (id {member_id}), member can self service add later: {e}")
            
            return {}
    
    except NoResultFound:
        pass
    
    logging.info(f'member id {member_id} validating phone number, no request for this member')
    raise NotFound("Koden är fel")


validation_tries = defaultdict(lambda: 0)


def inc_tries(member_id):
    validation_tries[member_id] += 1
    return validation_tries[member_id]
