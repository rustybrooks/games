#!/usr/bin/env python3

import sys

input = sys.argv[1]
rest = sys.argv[2:]
output = f'{input}.filtered'

with open(input) as f:
  in_words = set([x.lower() for x in f.read().splitlines()])

verify_words = None
for verify in rest:
  with open(verify) as f:
    these = set([x.lower() for x in f.read().splitlines()])
    if verify_words is None:
      verify_words = these
    else:
      verify_words &= these

with open(output, 'w') as f:
  valid = list(in_words & verify_words)
  valid.sort()
  f.write(f'# {input} filtered through {rest}\n')
  f.write('\n'.join(valid))

