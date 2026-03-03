// تحويل البيانات من Excel إلى ملف txt
const fs = require('fs');

const rawData = `akpulatomer4734@gmail.com	Omer	Akpulat	905307074347	 Turkey	Full Registration	 $100,000.00 
muhammedrafivakkela@gmail.com	Mohammed Rafi Vakkela	Valappil Abubackerhaji	971568005923	 United Arab Emirates	Full Registration	 $5,997.12 
shrisaicementtradors@gmail.com	Sanjeev Kumar	Dhama	919871426867	 India	Full Registration	 $22,355.89 
galaxyvinu6@gmail.com	Vinu Chalona	John	971529494727	 United Arab Emirates	Full Registration	 $5,262.70 
sunnychablani43@gmail.com	SUNNY	CHHABLANI	971503189069	 India	Full Registration	 $10,242.60 
jasodamirchandani@gmail.com	Jasoda	Mirchandani	971506495898	 United Arab Emirates	Full Registration	 $9,825.30 
sarah.lokhandwala57@gmail.com	Sarah Afzal Lokhandwala Fakrudin	Yusufbhai Vora	971585291995	 United Arab Emirates	Full Registration	 $15,000.00 
ahmedrubel.bd@gmail.com	Mokter Ahmad	Mohammad Ediris	971562437400	 United Arab Emirates	Full Registration	 $27,506.14 
russelibrahim1985@gmail.com	MD	IBRAHIM	8801822854691	 Bangladesh	Full Registration	 $7,066.70 
wisemonk101@gmail.com	Vikram Deepak Reddy Kandula Sudhakar	Reddy Kandula	971585467202	 United Arab Emirates	Full Registration	 $11,464.75 
zoozmahamd711@gmail.com	AZEEZH ABDULLAH ALI	MOHAMMD	96560662105	 Kuwait	Full Registration	 $49,964.00 
guddu2915@gmail.com	Yogesh	Tulsiyani	971522380255	 United Arab Emirates	Full Registration	 $30,789.32 
ar258852@gmail.com	Abdulrahman Mohamad Abdallah Ibrahim	Stad	971557336887	 United Arab Emirates	Full Registration	 $21,768.69 
fai1407sal@gmail.com	FAISEL MOHAMMAD S	ALGHAMDI	966564028345	 Saudi Arabia	Full Registration	 $6,038.89 
s2louh@gmail.com	Saleh Majed Saleh Hamad	Almansoori	971568996660	 United Arab Emirates	Full Registration	 $20,000.00 
alkhyeli.hk@gmail.com	HAMAD ABDULAZIZ	ALKHYELI	971501111508	 United Arab Emirates	Full Registration	 $19,988.02 
manshishah6657@outlook.com	Mansi	Piyush Shah	919227088965	 India	Full Registration	 $5,095.61 
elihsangold47@hotmail.com	Umut	Akpulat	905343606547	 Turkey	Full Registration	 $400,000.00 
almotrafi111@gmail.com	YOUSEF AWADH O	ALMATRAFI	966503130429	 Saudi Arabia	Full Registration	 $21,717.08 
fr3on29@yahoo.com	ALI MOSTAFA KHUDHUR	AL SHAMMARI	96598702726	 Kuwait	Full Registration	 $10,001.36`;

const lines = rawData.trim().split('\n');
let output = '';
let count = 0;

lines.forEach(line => {
  const parts = line.split('\t').map(p => p.trim());
  if (parts.length >= 7) {
    const email = parts[0];
    const name = parts[1];
    const lastName = parts[2];
    const phone = parts[3];
    const country = parts[4];
    const balance = parts[6];
    
    output += `${email}\t${name}\t${lastName}\t${phone}\t${country}\t${balance}\n`;
    count++;
  }
});

fs.writeFileSync('contacts-data-full.txt', output);
console.log(`✅ تم التحويل: ${count} جهة اتصال`);
console.log(`📁 الملف: contacts-data-full.txt`);
