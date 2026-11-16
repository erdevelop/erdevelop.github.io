/*
 * erdevelop: GCC 13 (Ubuntu MinGW) uyumluluk katmanı.
 * libgcc'nin gthr-win32-cond.o modülü Vista koşul değişkeni işlevlerini,
 * libstdc++ ise rand_s'i içe aktarır. ReactOS (NT 5.2) bunları sunmadığı için
 * burada basit ve doğru (sahte uyanmaya izin veren) karşılıklar sağlanır.
 */
#include <windef.h>
#include <winbase.h>

static VOID WINAPI cv_init(PVOID cv) { *(PVOID *)cv = NULL; }
static VOID WINAPI cv_wake(PVOID cv) { (void)cv; }
static BOOL WINAPI cv_sleep_cs(PVOID cv, PCRITICAL_SECTION cs, DWORD ms)
{
    (void)cv;
    LeaveCriticalSection(cs);
    Sleep(ms == 0 ? 0 : 1);
    EnterCriticalSection(cs);
    return TRUE; /* koşul değişkenlerinde sahte uyanma serbesttir; çağıran koşulu yeniden denetler */
}
static int __cdecl my_rand_s(unsigned int *r)
{
    static unsigned int s = 0;
    if (!r) return 22;
    if (!s) s = GetTickCount() ^ (unsigned int)(ULONG_PTR)&s;
    s = s * 1103515245u + 12345u; *r = s ^ (GetTickCount() << 16);
    return 0;
}
void *imp_init  __asm__("__imp__InitializeConditionVariable@4") = (void *)cv_init;
void *imp_wake  __asm__("__imp__WakeConditionVariable@4")       = (void *)cv_wake;
void *imp_wakea __asm__("__imp__WakeAllConditionVariable@4")    = (void *)cv_wake;
void *imp_sleep __asm__("__imp__SleepConditionVariableCS@12")   = (void *)cv_sleep_cs;
void *imp_rands __asm__("__imp__rand_s")                        = (void *)my_rand_s;
