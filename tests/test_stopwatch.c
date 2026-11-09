#include <assert.h>
#include <stdio.h>
#include "../firmware/stopwatch.h"
static Stopwatch s;
static void ticks(unsigned long n){while(n--)sw_tick(&s);}
static void target(u16 n)
{
    sw_reset(&s);sw_digit(&s,n/1000);sw_digit(&s,(n/100)%10);
    sw_digit(&s,(n/10)%10);sw_digit(&s,n%10);sw_confirm(&s);
    assert(s.state==SW_READY && s.target==n);
}
int main(void)
{
    unsigned int n;
    sw_reset(&s);sw_control(&s);sw_confirm(&s);sw_digit(&s,15);
    assert(s.state==SW_INPUT && s.count==0);
    sw_digit(&s,0);sw_digit(&s,1);sw_confirm(&s);
    assert(s.state==SW_INPUT && s.count==2);
    sw_digit(&s,2);sw_digit(&s,3);sw_digit(&s,9);sw_confirm(&s);
    assert(s.target==123 && s.count==4 && s.state==SW_READY);
    sw_control(&s);ticks(9);assert(s.elapsed==0);ticks(1);assert(s.elapsed==1);
    ticks(1220);sw_control(&s);
    assert(s.state==SW_STOPPED && s.elapsed==123 && s.matched && s.blink_on);
    ticks(499);assert(s.blink_on);ticks(1);assert(!s.blink_on);
    ticks(500);assert(s.blink_on);assert(s.elapsed==123);
    sw_control(&s);assert(s.state==SW_READY && s.target==123 && !s.matched && s.elapsed==0);
    sw_control(&s);ticks(1220);sw_control(&s);assert(!s.matched && s.elapsed==122);
    ticks(2000);assert(s.blink_on && s.elapsed==122);
    target(9999);sw_control(&s);ticks(100000);sw_control(&s);
    assert(s.overflow && s.elapsed==9999 && !s.matched);
    /* All 10000 centisecond values; independent expected input elapsed. */
    for(n=0;n<10000;n++) {
        target(n);sw_control(&s);
        s.elapsed=n;s.sub_ms=0;sw_control(&s);
        assert(s.matched && s.state==SW_STOPPED);
        sw_reset(&s);assert(s.state==SW_INPUT && s.count==0 && s.target==0 && s.elapsed==0);
    }
    /* Actual ticks across seconds and the maximum display value. */
    target(9999);sw_control(&s);ticks(99990);sw_control(&s);
    assert(s.elapsed==9999 && s.matched && !s.overflow);
    target(100);sw_control(&s);ticks(1000);assert(s.elapsed==100);
    sw_reset(&s);assert(s.state==SW_INPUT && s.count==0 && !s.matched);
    puts("PASS: input/confirm, 10ms quantization, 3-state control, 500ms blink, mismatch, overflow, reset, 10000 targets");
    return 0;
}
