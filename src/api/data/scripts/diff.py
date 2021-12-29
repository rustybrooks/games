#!/usr/bin/env python3

import sys

in1 = sys.argv[1]
in2 = sys.argv[2]

words1 = set(x for x in open(in1).read().splitlines() if '#' not in x)
words2 = set(x for x in open(in2).read().splitlines() if '#' not in x)

print('\n'.join(sorted([x for x in words1 - words2 if len(x) == 5])))
# print(words1 - words2)
print(len(words1-words2))
