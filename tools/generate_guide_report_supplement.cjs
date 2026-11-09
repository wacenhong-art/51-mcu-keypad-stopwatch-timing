const fs=require('fs'),path=require('path');
const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,AlignmentType,ImageRun,PageBreak,HeightRule}=require('docx');
const root=path.resolve(__dirname,'..'),body=[];
function p(t,size=21,bold=false){body.push(new Paragraph({children:[new TextRun({text:t,size,bold})],spacing:{after:55,line:240}}));}
function h(t){body.push(new Paragraph({children:[new TextRun({text:t,font:'黑体',size:23,bold:true})],keepNext:true,spacing:{before:80,after:55}}));}
function code(t){for(const line of t.split('\n'))body.push(new Paragraph({children:[new TextRun({text:line,font:'Consolas',size:19})],spacing:{before:0,after:0,line:200,lineRule:'exact'},widowControl:false}));}
function tab(rows){const ws=[2100,8000];body.push(new Table({width:{size:10100,type:WidthType.DXA},columnWidths:ws,rows:rows.map(row=>new TableRow({children:row.map((t,i)=>new TableCell({width:{size:ws[i],type:WidthType.DXA},children:[new Paragraph({children:[new TextRun({text:t,size:21})],spacing:{after:60,line:250}})]}))}))}));}
h('实验二补充页：流程图、初值计算与关键程序');
p('按老师要求，匹配时八位整体亮1s、灭1s；LCD提示、输入、K1/K2/K3与原显示功能保留。普中实际板：P0段码，P2.2～P2.4译码位选；LCD共用P0，P2.6/5/7为RS/RW/E。运行前断电取下P5两枚串口跳线帽。',20);
h('1. 定时器0初值计算（纠正原页算术及单位笔误）');
p('12T计数频率=11059200÷12=921600Hz；1ms为921.6计数，取922。初值=65536－922=64614=FC66H，故TH0=FCH、TL0=66H，TMOD低四位0001，ET0=EA=TR0=1。',20);
p('10个近似1ms节拍为0.01秒；1000节拍翻转亮灭，完整闪烁周期约2秒。原页FC18与100次为0.01秒有误。每组第二位后置小数点，形成XX.XX；ISR重装有延迟，绝对误差未校准。',20);
h('2. 动态扫描流程图');
body.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new ImageRun({type:'png',data:fs.readFileSync(path.join(root,'docs/指导书填充版/动态扫描流程图.png')),transformation:{width:565,height:156}})],spacing:{before:0,after:20}}));
h('3. 关键程序（按原工程精简；变量、消抖与LCD驱动见工程）');
p('状态INPUT/READY/RUNNING/STOPPED；K1四位确认后READY，K2调用sw_control，K3复位。target与elapsed单位0.01s。',19);
code(`void sw_control(volatile Stopwatch *s) {
  if(s->state==SW_READY || s->state==SW_STOPPED) {
    s->elapsed=0; s->sub_ms=0; s->overflow=0;
    s->matched=0; s->blink_ms=0; s->blink_on=1;
    s->state=(s->state==SW_READY)?SW_RUNNING:SW_READY;
  } else if(s->state==SW_RUNNING) {
    s->state=SW_STOPPED;
    s->matched=(!s->overflow && s->elapsed==s->target);
    s->blink_ms=0; s->blink_on=1;
  }
}
void sw_tick(volatile Stopwatch *s) {
  if(s->state==SW_RUNNING && ++s->sub_ms==10) {
    s->sub_ms=0;
    if(s->elapsed<9999) ++s->elapsed; else s->overflow=1;
  } else if(s->state==SW_STOPPED && s->matched
            && ++s->blink_ms==1000) {
    s->blink_ms=0; s->blink_on=!s->blink_on;
  }
}
void timer0_tick(void) interrupt 1 {
  static u8 pos=0,div=0;
  TH0=0xFC; TL0=0x66; sw_tick(&watch);
  P0=0; P2=(P2&0xE3)|((7-pos)<<2);
  last_segment=(watch.matched && !watch.blink_on)
               ?0:segments[pos];
  P0=last_segment; pos=(pos+1)&7;
  if(++div==5){div=0;key_sample();}
}`);
body.push(new Paragraph({children:[new PageBreak()]}));
h('实验二补充页：实验截图与结果分析（末页）');
body.push(new Table({width:{size:10100,type:WidthType.DXA},columnWidths:[5050,5050],rows:[new TableRow({height:{value:2900,rule:HeightRule.EXACT},children:[['不一致现象','目标01.00；停止01.03','已获文字反馈，实物照片待补'],['一致现象','应显示MATCH，整体亮1s、灭1s','尚未实板命中，照片待补']].map(rows=>new TableCell({width:{size:5050,type:WidthType.DXA},verticalAlign:'center',children:rows.map((text,i)=>new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text,size:i===0?23:21,bold:i===0})],spacing:{after:100}}))}))})]}));
p('未收到实物照片，保留位置供后续插入或打印后粘贴；不以模拟图代替实测。',20);
tab([['项目','记录'],['原有实板流程','输入与K1确认正常；目标01.00、停止01.03，LCD显示NO MATCH。'],['清零与复位','第三次K2清零右侧并保留左01.00；K3可全部复位。'],['本次新增要求','匹配状态每1000个名义1ms节拍翻转，亮1s、灭1s；LCD功能保留。'],['新版软件与下载','编译0错误、0警告；500/999ms不翻转、1000ms翻转的边界测试通过；新版已实际烧录。']]);
h('结果分析');
p('01.03比01.00多0.03秒，两者不同，NO MATCH符合比较规则；K2启动、停止、清零及K3复位已获用户确认。原有流程的记录与本次1秒闪烁改动分开说明。');
p('本次1s/1s节拍边界已由软件测试验证。真实MATCH状态的周期尚未用实板观察或仪器测定，不把软件测试写成已拍到匹配闪烁。');
p('本报告前3页直接来自综合实验指导书实验二：仅将原页两处0.5s按老师要求改为1s，并在第3页空白处填入思考题答案；本页和前一补充页加入所需图表、计算、程序及记录。',20);
const doc=new Document({styles:{default:{document:{run:{font:'宋体',size:21},paragraph:{spacing:{line:240}}}}},sections:[{properties:{page:{size:{width:12240,height:15840},margin:{top:900,bottom:900,left:1070,right:1070}}},children:body}]});
const dest=path.join(root,'docs','指导书填充版');fs.mkdirSync(dest,{recursive:true});
Packer.toBuffer(doc).then(b=>fs.writeFileSync(path.join(dest,'实验二_补充内容_1s闪烁.docx'),b));
