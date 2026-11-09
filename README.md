# 实验二：键盘、独立按键与数码管的秒表定时实验

STC89C52RC、11.0592MHz、12T，普中51开发板。八位数码管显示目标与停止结果，LCD1602显示操作提示。按指导书使用K1/K2/K3。

## 首次使用

1. 运行tools/PZ-ISP.exe，选STC89C5xx-RC、12T、9600、当前CH340端口（本次COM8）。P5两枚黄色串口跳线保持安装。
2. 打开firmware/experiment2.hex，点击下载后对开发板断电重启。
3. 确认下载成功，关闭电源，取下USB插口上方、蓝色电源开关右侧标P5的两枚黄色串口跳线帽，再打开电源。只取下小帽，不移动长排黄色端子。
4. UART保持关闭，K1/P3.1、K2/P3.0用作GPIO。以后重新下载前，断电装回P5两枚跳线，恢复原接法。

## 操作

- 矩阵S1～S10依次对应0～9。输入四位，例如0100表示01.00秒，再按K1确认。
- K2第1次启动，右四位保持00.00；第2次停止，右侧显示最终XX.XX；第3次清零并回到待启动状态，保留目标。
- 目标与停止值相等时，八位数码管整体亮500ms、灭500ms；液晶显示MATCH。不相等则不闪烁，显示NO MATCH。
- K3随时复位，目标输入和计时全部清零。未满四位K1不会确认；无效矩阵键、额外数字被忽略。
- 超过99.99秒不回绕，显示上限并提示OVERFLOW，避免超量程误判为相等。

LCD示例：T:01.00 READY，K2:START K3:RST；运行中提示K2:STOP；停止后R:00.97 NO MATCH，K2:CLEAR。液晶是辅助提示，八位数码管按实验要求显示。

## 构建

打开firmware/experiment2.uvproj，或在PowerShell运行：

```powershell
.\firmware\build.ps1 -KeilC51Root 'D:/keil-C51/C51'
gcc tests/test_stopwatch.c firmware/stopwatch.c -o tests/test_stopwatch.exe
.\tests\test_stopwatch.exe
```

实际Keil编译：0错误、0警告，code=2564字节，data=67.1字节。测试覆盖1万种目标、输入校验、三态控制、10ms累计、500ms闪烁、复位和溢出。软件测试不冒充实板观察。

## 接口与时间基准

P1为矩阵键盘；P0共用数码管段码与LCD数据；P2.2/P2.3/P2.4为74HC138位选，P2.6/5/7为LCD RS/RW/E。LCD E平时保持低，写LCD时短暂保护P0，写完恢复段码。

Timer0方式1，初值FC66：65536−922=64614=FC66，922×12/11059200≈1.000434ms；10个节拍为约0.01秒。每节拍扫描一位，八位刷新约125Hz；每5个节拍扫描一次按键，连续20ms稳定后触发，松手后再解锁。匹配后的闪烁由中断累计500节拍实现。

指导书所写“64615=FC18”“100次1ms=0.01秒”存在算术/单位错误，本实现已修正。小数点放在每组第2位后，显示XX.XX。ISR入口与重装耗时仍带来小幅计时误差，未用示波器校准，不把理论时基当作绝对精度实测结论。

## 归档内容

firmware为最终源码、Keil工程与HEX；tests为独立状态机测试；evidence为实际编译与烧录证据；references包含原始PDF和示例ZIP；docs为实验说明与报告；tools包含下载工具和报告生成脚本。

PZ-ISP实际写入成功，耗时6.053s。实板显示与一致/不一致分支的验证状态见evidence/实板验收.md。

## 按键修复与验证

初版中断使用寄存器组1而调用组0函数，导致键值错误。最终版统一为组0并由编译器保存/恢复寄存器。汇编回归检查见tests/check_isr_bank.py；实际编译汇编保留在evidence/assembly。修复版已重新烧录，用户确认S2能输入数字1。其余实板验收持续记录在evidence/验收数据.json。

```powershell
python tests/check_isr_bank.py evidence/assembly/main.src evidence/assembly/stopwatch.src
```

报告可在tools目录执行npm install后运行node generate_report.cjs重新生成，读取evidence/验收数据.json。PDF是Word实际导出的打印版。

## 最终实板验收范围

用户已确认矩阵输入、K1确认、K2启动/停止/清零、K3复位。目标01.00、停止01.03，LCD为NO MATCH；第三次K2清零右侧并保留左侧01.00。手动操作未恰好命中目标，MATCH整体闪烁仅有软件测试通过，未取得对应实板照片。

Word与PDF报告见docs；快速操作见[板上操作卡](docs/板上操作卡.md)。
