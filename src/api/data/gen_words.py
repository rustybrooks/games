#!/usr/bin/env python

import sys

input, verify, output = sys.argv

with open(input) as f:
  in_words = set(f.read().splitlines())

with open(verify) as f:
  verify_words = set(f.read().splitlines())

with open(output, 'w') as f:
  f.write('\n'.join(sorted(in_words & verify_words))