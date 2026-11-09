#include "stopwatch.h"
void sw_reset(volatile Stopwatch *s)
{
    s->target=0;s->elapsed=0;s->blink_ms=0;
    s->state=SW_INPUT;s->count=0;s->sub_ms=0;
    s->overflow=0;s->matched=0;s->blink_on=1;
}
void sw_digit(volatile Stopwatch *s,u8 digit)
{
    if(s->state==SW_INPUT && s->count<4 && digit<10) {
        s->target=s->target*10+digit;++s->count;
    }
}
void sw_confirm(volatile Stopwatch *s)
{
    if(s->state==SW_INPUT && s->count==4) s->state=SW_READY;
}
void sw_control(volatile Stopwatch *s)
{
    if(s->state==SW_READY) {
        s->elapsed=0;s->sub_ms=0;s->overflow=0;
        s->matched=0;s->blink_ms=0;s->blink_on=1;
        s->state=SW_RUNNING;
    } else if(s->state==SW_RUNNING) {
        s->state=SW_STOPPED;
        s->matched=(!s->overflow && s->elapsed==s->target);
        s->blink_ms=0;s->blink_on=1;
    } else if(s->state==SW_STOPPED) {
        s->elapsed=0;s->sub_ms=0;s->overflow=0;
        s->matched=0;s->blink_ms=0;s->blink_on=1;
        s->state=SW_READY;
    }
}
void sw_tick(volatile Stopwatch *s)
{
    if(s->state==SW_RUNNING) {
        if(++s->sub_ms==10) {
            s->sub_ms=0;
            if(s->elapsed<9999) ++s->elapsed;
            else s->overflow=1;
        }
    } else if(s->state==SW_STOPPED && s->matched) {
        /* Teacher requirement: 1000 nominal 1ms ticks per phase. */
        if(++s->blink_ms==1000) {
            s->blink_ms=0;s->blink_on=!s->blink_on;
        }
    }
}
