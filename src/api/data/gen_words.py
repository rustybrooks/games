#!/usr/bin/env python

import sys

input, verify, output = sys.argv[1:4]

with open(input) as f:
  in_words = set([x.lower() for x in f.read().splitlines()])

with open(verify) as f:
  verify_words = set([x.lower() for x in f.read().splitlines()])

with open(output, 'w') as f:
  valid = list(in_words & verify_words)
  valid.sort()
  f.write('\n'.join(valid))

