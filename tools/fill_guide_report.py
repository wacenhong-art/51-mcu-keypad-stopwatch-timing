from pathlib import Path
import pymupdf as f
root=Path(__file__).resolve().parents[1]
folder=root/'docs/指导书填充版';folder.mkdir(parents=True,exist_ok=True)
source=root/'references/manuals/《51单片机综合实验指导书》2026年.pdf'
src=f.open(source);raw=f.open();raw.insert_pdf(src,from_page=3,to_page=5)
raw.save(folder/'实验二_指导书原页摘录.pdf')
d=f.open();d.insert_pdf(src,from_page=3,to_page=5)
p=d[1];positions=p.search_for('0.5s');assert len(positions)==2
for rect in positions:p.add_redact_annot(rect,fill=(1,1,1))
p.apply_redactions(images=0,graphics=0)
for rect in positions:p.insert_text((rect.x0,579.9400024414062),'1s',fontname='tibo',fontsize=12,color=(0,0,0))
assert not p.search_for('0.5s') and len(p.search_for('1s'))==2
font=r'C:/Windows/Fonts/simsun.ttc'
p=d[2]
p.insert_text((72,526),'五、思考题答案（填写）',fontname='songans',fontfile=font,fontsize=12)
answers='1. 改为10ms后，内部起停量化变粗，百分之一秒显示位数不变；若每次仍扫描一位，整屏刷新仅12.5Hz，易闪烁，应保留高频扫描。\n2. 快速按K2可能因机械抖动误触发多个状态。采用约20ms稳定采样、松手解锁和事件队列，长按只响应一次。\n3. 软件长延时会阻塞按键及主循环，影响显示更新；用中断计数翻转亮灭标志，主循环仍能及时处理复位。'
left=p.insert_textbox(f.Rect(72,540,540,738),answers,fontname='songans',fontfile=font,fontsize=10.5,lineheight=1.4,color=(0,0,0));assert left>=0,left
assert '思考题答案' in p.get_text() and '松手解锁' in p.get_text()
supp=f.open(folder/'实验二_补充内容_1s闪烁.pdf');assert len(supp)==2;d.insert_pdf(supp)
d.set_metadata({'title':'实验二：指导书原页填充报告（老师要求亮1s、灭1s）','subject':'原指导书实验二三页＋必要答案、流程图、计算、关键程序和结果记录','creator':'PDF原页摘录及填写'})
output=folder/'实验二_指导书原页填充报告_1s闪烁.pdf';d.save(output,garbage=4,deflate=True)
assert len(d)==5
print('Filled report pages:',len(d),'Answer space remaining:',left)
