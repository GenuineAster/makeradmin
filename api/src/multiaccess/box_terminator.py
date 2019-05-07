from datetime import date, timedelta, datetime
from itertools import groupby
from operator import attrgetter

from sqlalchemy import desc
from sqlalchemy.orm import contains_eager
from sqlalchemy.orm.exc import NoResultFound

from membership.models import Member, Box, Span
from messages.views import message_entity
from service.db import db_session
from service.error import NotFound
from service.logging import logger
from service.util import date_to_str, dt_to_str
from flask import render_template


def get_labacess_end_date(box):
    try:
        return max(s.enddate for s in box.member.spans
                   if s.type in (Span.LABACCESS, Span.SPECIAL_LABACESS) and not s.deleted_at)
    except ValueError:
        return None


def get_box_query():
    query = db_session.query(Box).join(Member).outerjoin(Span)
    query = query.options(contains_eager(Box.member), contains_eager(Box.member).contains_eager(Member.spans))
    return query


def get_expire_date_from_labaccess_end_date(end_date):
    return expire_date + timedelta(days=45)

def get_box_info(box):
    expire_date = (get_labacess_end_date(box) or date(1997, 9, 26)) + timedelta(days=1)
    terminate_date = get_expire_date_from_labaccess_end_date(expire_date)
    
    today = date.today()
    if today < expire_date:
        status = "active"
    elif today < terminate_date:
        status = "expired"
    else:
        status = "terminate"
        
    return {
        "box_label_id": box.box_label_id,
        "member_number": box.member.member_number,
        "name": f"{box.member.firstname} {box.member.lastname or ''}",
        "expire_date": date_to_str(expire_date),
        "terminate_date": date_to_str(terminate_date),
        "status": status,
        "last_nag_at": dt_to_str(box.last_nag_at),
        "last_check_at": dt_to_str(box.last_check_at),
    }


def box_terminator_boxes():
    query = get_box_query()
    return [get_box_info(b) for b in query.order_by(desc(Box.last_check_at))]
    
    
def box_terminator_nag(member_number=None, box_label_id=None):
    raise NotImplemented("Disabled until message is fixed.")
    
    try:
        box = db_session.query(Box).filter(Box.box_label_id == box_label_id,
                                           Member.member_number == member_number).one()
    except NoResultFound:
        raise NotFound()
    
    end_date = get_labacess_end_date(box)
    expire_date = get_expire_date_from_labaccess_end_date(end_date)
    message_entity.create({
        "recipients": [{"type": "member", "id": box.member.member_id}],
        "message_type": "email",
        "title": "Förnya ditt medlemskap!",
        "description": render_template(
            "nag_email_expired.html" if date.today() >= expire_date else "nag_email.html",
            member=box.member,
            terminate_date=date_to_str(get_expire_date_from_labaccess_end_date(end_date)),
            labaccess_end_date=date_to_str(end_date)
        )
    }, commit=False)

    box.last_nag_at = datetime.utcnow()
    

def box_terminator_validate(member_number=None, box_label_id=None, session_token=None):
    query = get_box_query()
    query = query.filter(Box.box_label_id == box_label_id)
    try:
        box = query.one()
    except NoResultFound:
        try:
            member = db_session.query(Member).filter(Member.member_number == member_number).one()
        except NoResultFound:
            raise NotFound()
        
        box = Box(member_id=member.member_id, box_label_id=box_label_id)
        
    box.last_check_at = datetime.utcnow()
    box.session_token = session_token
    db_session.add(box)
    db_session.flush()
    
    return get_box_info(box)
 