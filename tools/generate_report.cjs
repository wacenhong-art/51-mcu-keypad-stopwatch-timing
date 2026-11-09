const fs=require('fs');const path=require('path');
const {Document,Packer,Paragraph,TextRun,HeadingLevel,Table,TableRow,TableCell,WidthType,ImageRun,PageBreak,AlignmentType,Footer,PageNumber}=require('docx');
const root=path.resolve(__dirname,'..');
const obs=JSON.parse(fs.readFileSync(path.join(root,'evidence/验收数据.json'),'utf8'));
const body=[];
function p(s){body.push(new Paragraph({children:[new TextRun(s)],spacing:{after:100,line:330}}));}
function h(s){body.push(new Paragraph({text:s,heading:HeadingLevel.HEADING_1,spacing:{before:200,after:120}}));}
function page(){body.push(new Paragraph({children:[new PageBreak()]}));}
function table(rows){const widths=[2700,6700];body.push(new Table({width:{size:9400,type:WidthType.DXA},columnWidths:widths,rows:rows.map(row=>new TableRow({children:row.map((s,i)=>new TableCell({width:{size:widths[i],type:WidthType.DXA},children:[new Paragraph({text:s,spacing:{after:80}})]}))}))}));}
body.push(new Paragraph({text:'单片机综合实验报告',alignment:AlignmentType.CENTER,heading:HeadingLevel.TITLE}));
body.push(new Paragraph({text:'实验二：键盘、独立按键与数码管的秒表定时实验',alignment:AlignmentType.CENTER,spacing:{before:260,after:300}}));
p('学院：__________  专业班级：__________');p('姓名：__________  学号：__________  实验日期：__________');
h('一、实验目的');
p('掌握动态数码管的段码与位选扫描、矩阵键盘识别、独立按键消抖与多状态切换；使用定时器中断建立近似1ms时基，完成百分之一秒计时、目标比较和非阻塞闪烁。');
h('二、实验设备与内容');
p('普中51开发板、STC89C52RC系列单片机、11.0592MHz晶振、4×4矩阵键盘、独立按键、八位共阴极数码管、LCD1602、USB数据线；软件为Keil uVision和PZ-ISP。');
p('输入四位目标时间，以XX.XX显示在左四位。K1确认；K2依次启动、停止、清零。运行中右四位保持00.00，停止后显示实际结果；与目标相同时八位整体亮0.5s、灭0.5s。K3在任意状态复位。LCD为附加操作提示。');
h('三、接线与按键冲突处理');
table([['资源','实际连接'],['矩阵键盘','P1；按普中实际行列映射，S1～S10对应0～9'],['K1／K2／K3','P3.1／P3.0／P3.2'],['数码管','P0段码；P2.2、P2.3、P2.4经74HC138位选'],['LCD1602','数据P0；RS=P2.6，RW=P2.5，E=P2.7']]);
p('程序严格使用K1/K2，运行时关闭UART。烧录时P5串口跳线安装；下载完成后断电取下P5两枚黄色小帽，再上电操作，避免CH340输出与按键共用P3.0。下次烧录前断电装回原位。');
page();h('四、定时与显示原理');
p('12T模式下定时器计数频率为11059200÷12=921600Hz，机器周期约1.085069μs。1ms对应921.6个计数，取922个计数。');
p('重装值=65536−922=64614=0xFC66，因此TH0=0xFC、TL0=0x66。名义周期=922÷921600≈1.000434ms。');
p('指导书的“64615=0xFC18”不成立，0xFC18对应1000个计数，约1.085ms；“100次1ms=0.01秒”也有单位错误，应累计10次约1ms为0.01秒。');
table([['寄存器／变量','配置或作用'],['TMOD低四位','0001，Timer0方式1、内部时钟、不门控'],['TH0／TL0','FC／66'],['ET0、EA、TR0','均置1；TF0启动前清零'],['sub_ms','累计10个节拍后elapsed加1，单位为0.01秒'],['blink_ms','停止且相等时累计500节拍翻转亮灭'],['扫描指针','每节拍加1，对8取模；约125Hz刷新整屏']]);
p('普通Timer0方式1在中断入口后软件重装，ISR延迟会增加实际周期。本实验是教学时基，尚未用示波器或标准时钟校准；不得将理论计算当作绝对精度实测。');
p('数码管每组小数点放在第二位后，显示XX.XX。先消隐P0，再换位选，再输出段码。液晶与数码管共用P0，液晶E平时保持低；写LCD时只在短暂总线操作期间关闭中断，写完立即恢复当前段码。');
h('五、程序状态与输入处理');
p('INPUT：接收四位目标，未满四位不能确认。READY：等待K2。RUNNING：中断累计时间，右四位仍显示00.00。STOPPED：锁存时间并比较；K2清零回READY且保留目标。K3使任意状态回到INPUT。');
p('每5个节拍采样一次按键，连续4次稳定约20ms才确认；松手后再次解锁，长按只触发一次。按键事件放入队列，由主循环更新LCD。超过99.99秒饱和并置溢出标志，不回绕，也不误判匹配。');
page();h('六、数码管动态扫描流程图');
body.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new ImageRun({type:'png',data:fs.readFileSync(path.join(root,'docs/动态扫描流程图.png')),transformation:{width:490,height:595}})]}));
p('图1：Timer0中断中的计时、显示和按键采样流程。主循环负责事件处理，不用长延时实现闪烁。');
page();h('七、实验步骤与实际记录');
p('1. 编译工程生成experiment2.hex，在PZ-ISP选择STC89C5xx-RC、12T、9600和实际CH340串口，本次为COM8。');
p('2. 点击下载后断电重启。确认文件下载完毕，再断电取下P5两枚黄色串口跳线帽。重新上电后检查左右00.00和LCD操作提示。');
p('3. 输入四位目标并按K1；按K2启动、再次按K2停止，观察结果及闪烁；第三次按K2清零。K3验证全局复位。');
p('实际编译：0错误、0警告，code=2564字节、data=67.1字节。PZ-ISP实际下载成功，耗时6.053s。');
p('上电显示：'+obs.initial);p('不匹配与三态控制：'+obs.mismatch);p('匹配与闪烁：'+obs.match);
p('软件测试：覆盖1万种目标、未满四位确认、无效/额外数字、10ms量化、启动/停止/清零、500ms翻转、不匹配不闪、溢出与复位。软件测试不代替实板现象和照片。');
page();h('八、思考题');
p('1. 若1ms改为10ms：直接计时分辨率变粗；可每次直接累计0.01秒，但显示扫描若仍一中断一位，整屏刷新仅12.5Hz，会明显闪烁。应分离计时节拍与高频显示扫描。');
p('2. 快速连续按K2：机械抖动可能误触发多个状态。采用稳定采样、松手解锁和事件队列，长按只响应一次。快于消抖窗口的输入不应视为有效独立按键。');
p('3. 软件长延时闪烁会阻塞按键和显示更新，降低响应。用中断计数翻转亮灭标志，主循环仍可处理K3复位，扫描继续运行。');
h('九、结论与参考资料');
p('已实现目标输入、三态控制、停止锁存、相等判断和非阻塞闪烁，并加入液晶提示。实际验收范围如上记录；尚未取得的匹配照片不作虚构。');
p('参考《51单片机综合实验指导书》2026年实验二（PDF第4～6页），《普中51单片机开发攻略》V1.3第12、13、14、21章，以及原厂动态数码管、按键、矩阵键盘、定时器、LCD1602示例。');
const doc=new Document({styles:{default:{document:{run:{font:'宋体',size:24},paragraph:{spacing:{line:330}}}},paragraphStyles:[{id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,run:{font:'黑体',size:28,bold:true}}]},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1250,right:1250}}},footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun('第 '),new TextRun({children:[PageNumber.CURRENT]}),new TextRun(' 页')]})]})},children:body}]});
Packer.toBuffer(doc).then(b=>fs.writeFileSync(path.join(root,'docs/实验二_秒表定时实验报告.docx'),b));
