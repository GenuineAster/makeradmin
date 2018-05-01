#!/usr/bin/env python3

import argparse
import re
import sys
from itertools import chain
from logging import basicConfig, INFO, getLogger
from os import listdir, path

from multi_access.dump.dump import to_file

logger = getLogger("makeradmin")


def main():

    basicConfig(format='%(asctime)s %(levelname)s [%(pathname)s:%(lineno)d]: %(message)s', stream=sys.stderr, level=INFO)

    parser = argparse.ArgumentParser()
    parser.add_argument("-d", "--db",
                        default='mssql://(local)\\SQLEXPRESS/MultiAccess?trusted_connection=yes&driver=SQL+Server',
                        help="SQL Alchemy db engine spec.")
    parser.add_argument("-o", "--out-dir", default='.',
                        help="Dir where to store dump files.")
    parser.add_argument("-e", "--extension", default='pkl',
                        help="Format pkl or json.")
    args = parser.parse_args()
    
    # Find out filename to dump to.
    
    if args.extension not in ['pkl', 'json']:
        logger.error('bad extension')
        raise SystemExit()
    
    def int_from_filename(filename):
        if not path.isfile(path.join(args.out_dir, filename)):
            return 0
        m = re.match(r'dump-(\d+).' + args.extension, filename)
        if not m:
            return 0
        return int(m.group(1))
    
    next_id = max(chain([0], (int_from_filename(f) for f in sorted(listdir(args.out_dir))))) + 1
    
    filename = path.join(args.out_dir, f'dump-{next_id:03}.{args.extension}')
    
    # Dump db to file.
    
    logger.info(f'dumping to {filename} fron {args.db}')
    to_file(filename, db_name=args.db)
    logger.info(f'dump complete')

    
if __name__ == '__main__':
    main()
    
    