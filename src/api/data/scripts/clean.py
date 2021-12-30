#!/usr/bin/env python3

import sys
import re

infile = sys.argv[1]
outfile = f'{infile}.clean'


clear_re = re.compile(r'^#?\w*[a-z]$')

out = set()
with open(infile) as f, open(outfile, 'w') as fo:
   for line in f:
       line = line.strip()
       if not line: continue
       line = line.lower()

       if not clear_re.match(line): continue
       out.add(line)

   fo.write('\n'.join(sorted(out)))
 
