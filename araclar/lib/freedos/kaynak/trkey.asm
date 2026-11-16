; TRKEY.COM - DOS icin kucuk Turkce Q klavye surucusu (yerlesik program)
; BIOS INT 16h'yi yakalar; ABD duzenine gore gelen tuslari Turkce Q (CP857) karakterlerine cevirir.
org 0x100
        jmp kur
eski16: dd 0
; tablo: tarama kodu, ABD karakteri, Turkce karakter
tablo:  db 0x17,'i',0x8D, 0x17,'I','I'
        db 0x28,"'",'i',  0x28,'"',0x98
        db 0x1A,'[',0xA7, 0x1A,'{',0xA6
        db 0x1B,']',0x81, 0x1B,'}',0x9A
        db 0x27,';',0x9F, 0x27,':',0x9E
        db 0x33,',',0x94, 0x33,'<',0x99
        db 0x34,'.',0x87, 0x34,'>',0x80
        db 0x35,'/','.',  0x35,'?',':'
        db 0x2B,'\',',',  0x2B,'|',';'
        db 0x56,'\','<',  0x56,'|','>'
        db 0x0C,'-','*',  0x0C,'_','?'
        db 0x0D,'=','-',  0x0D,'+','_'
        db 0x29,'`','"',  0x29,'~',0x82
        db 0x03,'@',"'",  0x04,'#','^', 0x05,'$','+', 0x07,'^','&'
        db 0x08,'&','/',  0x09,'*','(', 0x0A,'(',')', 0x0B,')','='
        db 0
; AX = (tarama<<8)|karakter -> cevrilmis AX
cevir:  push si
        mov si, tablo
.d:     cmp byte [cs:si], 0
        je .son
        cmp ah, [cs:si]
        jne .ileri
        cmp al, [cs:si+1]
        jne .ileri
        mov al, [cs:si+2]
        jmp .son
.ileri: add si, 3
        jmp .d
.son:   pop si
        ret
yeni16: cmp ah, 0x00
        je .oku
        cmp ah, 0x10
        je .oku
        cmp ah, 0x01
        je .bak
        cmp ah, 0x11
        je .bak
        jmp far [cs:eski16]
.oku:   pushf
        call far [cs:eski16]
        call cevir
        iret
.bak:   pushf
        call far [cs:eski16]
        jz .bos
        call cevir
        or sp, sp               ; ZF=0: tus var
        retf 2
.bos:   retf 2
son_yerlesik:
kur:    mov ax, 0x3516
        int 0x21
        mov [eski16], bx
        mov [eski16+2], es
        mov dx, yeni16
        mov ax, 0x2516
        int 0x21
        mov dx, mesaj
        mov ah, 9
        int 0x21
        mov dx, (son_yerlesik - $$ + 0x100 + 15) / 16
        mov ax, 0x3100
        int 0x21
mesaj:  db 'Turkce Q klavye etkin.', 13, 10, '$'
