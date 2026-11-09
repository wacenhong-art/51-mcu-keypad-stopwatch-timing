import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from matplotlib.font_manager import FontProperties
from pathlib import Path
fp=FontProperties(fname=r'C:/Windows/Fonts/msyh.ttc',size=10)
texts=['Timer0中断入口','重装TH0=FC、TL0=66；累计近似1ms','运行时每10节拍累计0.01秒；相等时每500节拍翻转亮灭','P0输出0，先消隐上一位','设置74HC138位选；保留LCD控制引脚','匹配且灭相：输出0；否则输出当前位段码','扫描指针加1并对8取模','每5节拍采样按键，连续20ms稳定后产生一次事件','中断返回；主循环处理确认、启动/停止/清零、复位及LCD更新']
fig,ax=plt.subplots(figsize=(7.0,8.5));ax.set(xlim=(0,10),ylim=(0,12));ax.axis('off')
for i,t in enumerate(texts):
 y=11.1-i*1.25
 ax.add_patch(FancyBboxPatch((0.7,y-0.36),8.6,0.72,boxstyle='round,pad=0.12',facecolor='white',edgecolor='black',linewidth=1))
 ax.text(5,y,t,ha='center',va='center',fontproperties=fp)
 if i<len(texts)-1:ax.annotate('',xy=(5,y-0.88),xytext=(5,y-0.49),arrowprops={'arrowstyle':'->','color':'black','lw':1})
fig.tight_layout(pad=0.2)
fig.savefig(Path(__file__).resolve().parents[1]/'docs/动态扫描流程图.png',dpi=180,bbox_inches='tight');plt.close(fig)
