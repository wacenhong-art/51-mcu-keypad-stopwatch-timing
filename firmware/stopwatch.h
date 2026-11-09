#ifndef STOPWATCH_H
#define STOPWATCH_H
typedef unsigned char u8;
typedef unsigned int u16;
#define SW_INPUT 0
#define SW_READY 1
#define SW_RUNNING 2
#define SW_STOPPED 3
typedef struct {
    u16 target,elapsed,blink_ms;
    u8 state,count,sub_ms,overflow,matched,blink_on;
} Stopwatch;
void sw_reset(volatile Stopwatch *s);
void sw_digit(volatile Stopwatch *s,u8 digit);
void sw_confirm(volatile Stopwatch *s);
void sw_control(volatile Stopwatch *s);
void sw_tick(volatile Stopwatch *s);
#endif
