; TRFONT.COM - VGA metin moduna CP857 (Turkce) 8x16 yazi tipi yukler
; erdevelop Konsol icin; glifler Linux "Uni2-VGA16" konsol yazi tipinden (GPL) uretildi.
org 0x100
        push cs
        pop es
        mov si, ranges
.next:  lodsw                   ; baslangic karakteri
        cmp ax, 0xFFFF
        je .done
        mov dx, ax
        lodsw                   ; adet
        mov cx, ax
        mov bp, dx
        shl bp, 4               ; *16 bayt
        add bp, font
        push si
        mov ax, 0x1110          ; kullanici yazi tipi yukle
        mov bx, 0x1000          ; BH=16 satir, BL=0 blok
        int 0x10
        pop si
        jmp .next
.done:  mov dx, msg
        mov ah, 9
        int 0x21
        mov ax, 0x4C00
        int 0x21
ranges: dw 128,50, 179,41, 221,2, 224,32, 0xFFFF
msg:    db 'CP857 Turkce yazi tipi yuklendi.', 13, 10, '$'
font:   incbin "cp857.f16"
