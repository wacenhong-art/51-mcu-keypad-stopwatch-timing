#include <REG52.H>
#include <intrins.h>
#include "stopwatch.h"

/* P5 UART jumpers MUST be removed after flashing, power OFF first.
 * K1/P3.1 confirm; K2/P3.0 start-stop-clear; K3/P3.2 reset.
 * UART remains disabled so these pins are GPIO.
 */
sbit KEY1=P3^1;
sbit KEY2=P3^0;
sbit KEY3=P3^2;
sbit LCD_RS=P2^6;
sbit LCD_RW=P2^5;
sbit LCD_E=P2^7;
static volatile Stopwatch watch;
static volatile u8 segments[8],last_segment;
static volatile u8 queue[4],head,tail;
static u8 code digit_code[10]={0x3f,0x06,0x5b,0x4f,0x66,0x6d,0x7d,0x07,0x7f,0x6f};

static void delay_ms(u16 ms)
{
    u16 i;
    while(ms--) for(i=0;i<110;i++) _nop_();
}
static void lcd_write(u8 value,u8 data_select)
{
    bit enabled;
    enabled=EA;EA=0;
    LCD_E=0;LCD_RW=0;LCD_RS=data_select;
    P0=value;_nop_();_nop_();LCD_E=1;
    _nop_();_nop_();_nop_();_nop_();LCD_E=0;
    P0=last_segment;EA=enabled;
    delay_ms(1);
}
static void lcd_line(u8 row,char code *text)
{
    u8 i;
    lcd_write(row?0xC0:0x80,0);
    for(i=0;i<16;i++) {
        if(*text)lcd_write(*text++,1);
        else lcd_write(' ',1);
    }
}
static void lcd_time(u8 column,u8 row,u16 value)
{
    lcd_write((row?0xC0:0x80)+column,0);
    lcd_write('0'+value/1000,1);
    lcd_write('0'+(value/100)%10,1);
    lcd_write('.',1);
    lcd_write('0'+(value/10)%10,1);
    lcd_write('0'+value%10,1);
}
static void lcd_init(void)
{
    LCD_E=0;LCD_RW=0;LCD_RS=0;P0=0;
    delay_ms(40);lcd_write(0x38,0);delay_ms(5);
    lcd_write(0x38,0);lcd_write(0x38,0);
    lcd_write(0x0C,0);lcd_write(0x06,0);
    lcd_write(0x01,0);delay_ms(5);
}

/* Called only by the timer ISR: reject simultaneous matrix keys. */
static u8 raw_key(void)
{
    u8 c,r,v,k=255;
    if(!KEY3)return 3;
    if(!KEY1 && KEY2)return 1;
    if(KEY1 && !KEY2)return 2;
    if(!KEY1 && !KEY2)return 254;
    for(c=0;c<4;c++) {
        P1=(u8)~(0x08>>c);_nop_();_nop_();
        v=P1&0xF0;
        for(r=0;r<4;r++)if(!(v&(0x80>>r))) {
            if(k!=255){P1=0xFF;return 254;}
            k=10+r*4+c;
        }
    }
    P1=0xFF;return k;
}
static void key_sample(void)
{
    static u8 previous=255,stable=255,samples=0,armed=1;
    u8 k,next;
    k=raw_key();
    if(k!=previous){previous=k;samples=1;}
    else if(samples<4)++samples;
    if(samples==4 && k!=stable) {
        stable=k;
        if(k==255)armed=1;
        else if(armed) {
            armed=0;
            if(k!=254) {
                next=(head+1)&3;
                if(next!=tail){queue[head]=k;head=next;}
            }
        }
    }
}

static void encode_time(u16 value,u8 *out)
{
    out[0]=digit_code[value/1000];
    out[1]=digit_code[(value/100)%10]|0x80;
    out[2]=digit_code[(value/10)%10];
    out[3]=digit_code[value%10];
}
static void refresh_screen(u8 short_input)
{
    u8 i,state,count,matched,overflow;
    u8 new_segments[8];
    u16 target,result;
    EA=0;
    state=watch.state;count=watch.count;target=watch.target;
    result=watch.elapsed;matched=watch.matched;overflow=watch.overflow;
    EA=1;
    if(state!=SW_STOPPED)result=0;
    encode_time(target,new_segments);encode_time(result,new_segments+4);
    EA=0;for(i=0;i<8;i++)segments[i]=new_segments[i];EA=1;
    if(state==SW_INPUT) {
        lcd_line(0,"T:00.00 IN:0/4");lcd_time(2,0,target);
        lcd_write(0x8B,0);lcd_write('0'+count,1);
        if(short_input)lcd_line(1,"NEED 4 DIGITS");
        else lcd_line(1,"K1:OK K3:RESET");
    } else if(state==SW_READY) {
        lcd_line(0,"T:00.00 READY");lcd_time(2,0,target);
        lcd_line(1,"K2:START K3:RST");
    } else if(state==SW_RUNNING) {
        lcd_line(0,"T:00.00 RUNNING");lcd_time(2,0,target);
        lcd_line(1,"K2:STOP K3:RST");
    } else {
        if(overflow)lcd_line(0,"OVERFLOW >99.99");
        else {
            if(matched)lcd_line(0,"R:00.00 MATCH");
            else lcd_line(0,"R:00.00 NO MATCH");
            lcd_time(2,0,result);
        }
        lcd_line(1,"K2:CLEAR K3:RST");
    }
}

/* Keep bank 0: callees contain absolute ARn references. */
void timer0_tick(void) interrupt 1
{
    static u8 position=0,key_divider=0;
    /* Nominal 922 cycles ~=1ms at 11.0592MHz/12; ISR entry adds latency. */
    TH0=0xFC;TL0=0x66;
    sw_tick(&watch);
    P0=0;
    P2=(P2&0xE3)|((7-position)<<2);
    last_segment=(watch.matched && !watch.blink_on)?0:segments[position];
    P0=last_segment;position=(position+1)&7;
    if(++key_divider==5){key_divider=0;key_sample();}
}

void main(void)
{
    u8 event,short_input;
    EA=0;SCON=0;ES=0;TR1=0;TR2=0;
    P1=0xFF;KEY1=1;KEY2=1;KEY3=1;
    sw_reset(&watch);lcd_init();refresh_screen(0);
    EA=0;TMOD=(TMOD&0xF0)|0x01;
    TH0=0xFC;TL0=0x66;TF0=0;ET0=1;TR0=1;EA=1;
    while(1) {
        if(head!=tail) {
            EA=0;event=queue[tail];tail=(tail+1)&3;
            short_input=0;
            if(event==3)sw_reset(&watch);
            else if(event==1) {
                short_input=(watch.state==SW_INPUT && watch.count!=4);
                sw_confirm(&watch);
            } else if(event==2)sw_control(&watch);
            else if(event>=10 && event<20)sw_digit(&watch,event-10);
            EA=1;refresh_screen(short_input);
        }
    }
}
