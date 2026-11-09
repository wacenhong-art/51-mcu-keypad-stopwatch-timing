from pathlib import Path
import re,sys
main=Path(sys.argv[1]).read_text(errors='replace')
engine=Path(sys.argv[2]).read_text(errors='replace')
def bank(source,name):
 part=source.split(name+':',1)[1].split('; END OF',1)[0]
 return set(re.findall(r'USING\s+(\d+)',part))
caller=bank(main,'timer0_tick')
for name,source in [('raw_key',main),('key_sample',main),('_sw_tick',engine)]:
 target=bank(source,name)
 assert caller==target, f'FAIL: timer0_tick bank {caller} calls {name} bank {target}'
print('PASS: Timer0 ISR and key/tick callees use one register bank; no bank-1 to bank-0 calls')
