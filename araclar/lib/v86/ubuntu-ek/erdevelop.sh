[ -f /etc/erdevelop-tz ] && export TZ=$(cat /etc/erdevelop-tz)
[ -f /etc/erdevelop-size ] && stty cols $(cut -d" " -f1 /etc/erdevelop-size) rows $(cut -d" " -f2 /etc/erdevelop-size) 2>/dev/null
export LANG=C.UTF-8 LC_ALL=C.UTF-8 EDITOR=vi PYTHONDONTWRITEBYTECODE=1
PS1="\[\e[32m\]root@erdevelop\[\e[0m\]:\[\e[34m\]\w\[\e[0m\]# "
alias ll="ls -l --color=auto" la="ls -la --color=auto" ls="ls --color=auto" vi="vim.tiny" vim="vim.tiny" grep="grep --color=auto"
poweroff() { echo "Sistem kapatılıyor…"; sync; python3 -c "import ctypes; ctypes.CDLL(None).reboot(0x4321fedc)"; }
halt() { poweroff; }
