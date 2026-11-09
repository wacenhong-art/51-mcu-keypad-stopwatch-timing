from pathlib import Path
import win32com.client
folder=Path(__file__).resolve().parents[1]/'docs/指导书填充版'
app=win32com.client.DispatchEx('Word.Application');app.Visible=False;app.DisplayAlerts=0
try:
    doc=app.Documents.Open(str(folder/'实验二_补充内容_1s闪烁.docx'),ReadOnly=True)
    doc.ExportAsFixedFormat(str(folder/'实验二_补充内容_1s闪烁.pdf'),17)
    doc.Close(False)
finally:app.Quit()
print('Supplement PDF exported')
