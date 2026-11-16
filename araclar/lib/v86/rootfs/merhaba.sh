#!/bin/sh
for i in 1 2 3; do echo "$i. merhaba, ben gerçek bir Linux kabuğuyum"; done
echo "Çekirdek: $(uname -r)"
grep -m1 'model name' /proc/cpuinfo
