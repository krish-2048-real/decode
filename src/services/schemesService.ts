import { Scheme, SchemeMatchInput, SchemeMatchResult } from '../types/health';

export const SCHEMES_BY_LANG: Record<string, Scheme[]> = {
  en: [
    {
      id: 'pmjay',
      name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
      shortName: 'PM-JAY',
      description: 'World\'s largest government-funded healthcare scheme providing cashless secondary & tertiary hospital care.',
      benefits: '₹5 Lakhs per family per year for secondary and tertiary care hospitalization across impaneled hospitals.',
      eligibilitySummary: 'Deprived rural households based on SECC 2011, BPL families, or annual household income < ₹1,20,000.',
      category: 'Health Insurance'
    },
    {
      id: 'jsy',
      name: 'Janani Suraksha Yojana (JSY)',
      shortName: 'JSY',
      description: 'Safe motherhood intervention under National Health Mission promoting institutional delivery among poor pregnant women.',
      benefits: 'Direct cash assistance of ₹1,400 for institutional delivery in rural areas plus free transport & ASHA incentive.',
      eligibilitySummary: 'Pregnant women aged 19+ belonging to BPL/SC/ST households delivering in government health centers.',
      category: 'Maternal Health'
    },
    {
      id: 'rsby',
      name: 'Rashtriya Swasthya Bima Yojana / State Health Protection Card',
      shortName: 'RSBY',
      description: 'Health insurance scheme for unorganized sector workers and BPL families.',
      benefits: 'Cashless health insurance coverage up to ₹30,000 per family per year for most hospitalization-related illnesses.',
      eligibilitySummary: 'Unorganized sector workers, BPL ration card holders, and low-income families.',
      category: 'Health Protection'
    },
    {
      id: 'pmmvy',
      name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
      shortName: 'PMMVY',
      description: 'Maternity benefit program offering cash incentives for pregnant and lactating mothers.',
      benefits: 'Direct Cash Benefit of ₹5,000 in three installments upon early pregnancy registration and child vaccination.',
      eligibilitySummary: 'Pregnant women and lactating mothers for the first living child of the family.',
      category: 'Maternity Benefit'
    },
    {
      id: 'nhm_drugs',
      name: 'NHM Free Drugs and Free Diagnostics Service Initiative',
      shortName: 'NHM Free Care',
      description: 'Government initiative ensuring zero out-of-pocket expenditure for essential medicines and diagnostic tests at public health centers.',
      benefits: 'Free essential medicines, lab diagnostic tests, blood transfusion services, and free transport at PHC/CHCs.',
      eligibilitySummary: 'All citizens visiting Primary Health Centres, Community Health Centres, and Sub-District Hospitals.',
      category: 'Universal Care'
    }
  ],
  hi: [
    {
      id: 'pmjay',
      name: 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (PM-JAY)',
      shortName: 'PM-JAY',
      description: 'कैशलेस द्वितीयक और तृतीयक अस्पताल देखभाल प्रदान करने वाली विश्व की सबसे बड़ी सरकारी स्वास्थ्य योजना।',
      benefits: 'सूचीबद्ध अस्पतालों में प्रति परिवार प्रति वर्ष ₹5 लाख का मुफ़्त इलाज एवं स्वास्थ्य कवर।',
      eligibilitySummary: 'SECC 2011 के आधार पर वंचित ग्रामीण परिवार, बीपीएल परिवार या वार्षिक आय ₹1,20,000 से कम।',
      category: 'स्वास्थ्य बीमा'
    },
    {
      id: 'jsy',
      name: 'जननी सुरक्षा योजना (JSY)',
      shortName: 'JSY',
      description: 'राष्ट्रीय स्वास्थ्य मिशन के तहत निर्धन गर्भवती महिलाओं में संस्थागत प्रसव को बढ़ावा देने वाली योजना।',
      benefits: 'ग्रामीण क्षेत्रों में संस्थागत प्रसव पर ₹1,400 की सीधी नकद सहायता, मुफ़्त परिवहन और आशा प्रोत्साहन राशि।',
      eligibilitySummary: '19 वर्ष या उससे अधिक आयु की बीपीएल/एससी/एसटी गर्भवती महिलाएं।',
      category: 'मातृ स्वास्थ्य'
    },
    {
      id: 'rsby',
      name: 'राष्ट्रीय स्वास्थ्य बीमा योजना / राज्य स्वास्थ्य सुरक्षा कार्ड',
      shortName: 'RSBY',
      description: 'असंगठित क्षेत्र के श्रमिकों और बीपीएल परिवारों के लिए स्वास्थ्य बीमा योजना।',
      benefits: 'अस्पताल में भर्ती से जुड़ी बीमारियों के लिए प्रति परिवार प्रति वर्ष ₹30,000 तक कैशलेस इलाज।',
      eligibilitySummary: 'असंगठित क्षेत्र के श्रमिक, बीपीएल राशन कार्ड धारक और कम आय वाले परिवार।',
      category: 'स्वास्थ्य सुरक्षा'
    },
    {
      id: 'pmmvy',
      name: 'प्रधानमंत्री मातृ वंदना योजना (PMMVY)',
      shortName: 'PMMVY',
      description: 'गर्भवती और स्तनपान कराने वाली माताओं के लिए मातृत्व लाभ नकद प्रोत्साहन कार्यक्रम।',
      benefits: 'गर्भावस्था पंजीकरण और टीकाकरण पर तीन किस्तों में ₹5,000 का प्रत्यक्ष नकद लाभ।',
      eligibilitySummary: 'परिवार के पहले जीवित बच्चे के लिए गर्भवती महिलाएं और स्तनपान कराने वाली माताएं।',
      category: 'मातृत्व लाभ'
    },
    {
      id: 'nhm_drugs',
      name: 'एनएचएम मुफ़्त दवाएं और मुफ़्त जांच सेवा पहल',
      shortName: 'NHM मुफ़्त इलाज',
      description: 'सरकारी स्वास्थ्य केंद्रों पर आवश्यक दवाओं और नैदानिक जांचों के लिए शून्य खर्च सुनिश्चित करने वाली पहल।',
      benefits: 'पीएचसी/सीएचसी पर मुफ़्त आवश्यक दवाएं, पैथोलॉजी जांच, रक्त आधान और मुफ़्त परिवहन।',
      eligibilitySummary: 'प्राथमिक स्वास्थ्य केंद्रों और सामुदायिक स्वास्थ्य केंद्रों में जाने वाले सभी नागरिक।',
      category: 'सर्वभौमिक देखभाल'
    }
  ],
  mr: [
    {
      id: 'pmjay',
      name: 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (PM-JAY)',
      shortName: 'PM-JAY',
      description: 'कॅशलेस दुय्यम आणि तृतीयक रुग्णालय देखभाल प्रदान करणारी जगातील सर्वात मोठी सरकारी आरोग्य योजना.',
      benefits: 'सूचीबद्ध रुग्णालयांमध्ये प्रति कुटुंब प्रति वर्ष ₹५ लाखांपर्यंत मोफत उपचार कव्हर.',
      eligibilitySummary: 'SECC 2011 नुसार ग्रामीण कुटुंबे, बीपीएल कुटुंबे किंवा वार्षिक उत्पन्न ₹१,२०,००० पेक्षा कमी.',
      category: 'आरोग्य विमा'
    },
    {
      id: 'jsy',
      name: 'जननी सुरक्षा योजना (JSY)',
      shortName: 'JSY',
      description: 'राष्ट्रीय आरोग्य अभियानांतर्गत गरोदर महिलांमध्ये संस्थात्मक बाळंतपणास प्रोत्साहन देणारी योजना.',
      benefits: 'ग्रामीण भागात संस्थात्मक बाळंतपणासाठी ₹१,४०० ची थेट आर्थिक मदत आणि मोफत रुग्णवाहिका.',
      eligibilitySummary: '१९ वर्षे किंवा त्याहून अधिक वयाच्या बीपीएल/एससी/एसटी गरोदर महिला.',
      category: 'माता आरोग्य'
    },
    {
      id: 'rsby',
      name: 'राष्ट्रीय स्वास्थ्य बीमा योजना / राज्य आरोग्य कार्ड',
      shortName: 'RSBY',
      description: 'असंघटित क्षेत्रातील कामगार आणि बीपीएल कुटुंबांसाठी आरोग्य विमा योजना.',
      benefits: 'रुग्णालयात दाखल होण्याच्या आजारांसाठी प्रति कुटुंब प्रति वर्ष ₹३०,००० पर्यंत कॅशलेस कव्हर.',
      eligibilitySummary: 'असंघटित कामगार, बीपीएल रेशन कार्डधारक आणि कमी उत्पन्नाची कुटुंबे.',
      category: 'आरोग्य संरक्षण'
    },
    {
      id: 'pmmvy',
      name: 'प्रधानमंत्री मातृ वंदना योजना (PMMVY)',
      shortName: 'PMMVY',
      description: 'गरोदर आणि सस्तन मातांसाठी मातृत्व लाभ थेट आर्थिक मदत कार्यक्रम.',
      benefits: 'पहिल्या जिवंत अपत्यासाठी तीन हप्त्यांमध्ये ₹५,००० ची थेट बँक खात्यात मदत.',
      eligibilitySummary: 'कुटुंबातील पहिल्या अपत्यासाठी गरोदर महिला आणि स्तनपान देणाऱ्या माता.',
      category: 'मातृत्व लाभ'
    },
    {
      id: 'nhm_drugs',
      name: 'एनएचएम मोफत औषधे व मोफत तपासणी उपक्रम',
      shortName: 'NHM मोफत सेवा',
      description: 'शासकीय आरोग्य केंद्रांमध्ये अत्यावश्यक औषधे व तपासण्यांसाठी शून्य खर्च सुनिश्चित करणारा उपक्रम.',
      benefits: 'प्राथमिक आरोग्य केंद्रांवर मोफत औषधे, रक्त तपासणी, प्रयोगशाळा चाचण्या व मोफत रुग्णवाहिका.',
      eligibilitySummary: 'प्राथमिक आरोग्य केंद्र व ग्रामीण रुग्णालयांना भेट देणारे सर्व नागरिक.',
      category: 'सार्वत्रिक काळजी'
    }
  ],
  ta: [
    {
      id: 'pmjay',
      name: 'ஆயுஷ்மான் பாரத் பிரதான் மந்திரி ஜன் ஆரோக்ய யோஜனா (PM-JAY)',
      shortName: 'PM-JAY',
      description: 'இலவச மருத்துவ சிகிச்சை வழங்கும் உலகின் மிகப்பெரிய அரசு சுகாதார காப்பீட்டுத் திட்டம்.',
      benefits: 'அங்கீகரிக்கப்பட்ட மருத்துவமனைகளில் ஆண்டுக்கு குடும்பத்திற்கு ₹5 லட்சம் வரை இலவச சிகிச்சை.',
      eligibilitySummary: 'BPL குடும்பங்கள் அல்லது ஆண்டு வருமானம் ₹1,20,000-க்கு குறைவாக உள்ள குடும்பங்கள்.',
      category: 'சுகாதார காப்பீடு'
    },
    {
      id: 'jsy',
      name: 'ஜனனி சுரக்ஷா யோஜனா (JSY)',
      shortName: 'JSY',
      description: 'கர்ப்பிணிப் பெண்களுக்கு மருத்துவமனைப் பிரசவத்தை ஊக்குவிக்கும் தாய்மைப் பாதுகாப்புத் திட்டம்.',
      benefits: 'கிராமப்புறங்களில் பிரசவத்திற்கு ₹1,400 நேரடி நிதி உதவி மற்றும் இலவச வாகனம்.',
      eligibilitySummary: '19 வயதுக்கு மேற்பட்ட BPL / SC / ST கர்ப்பிணிப் பெண்கள்.',
      category: 'தாய்மை சுகாதாரம்'
    },
    {
      id: 'rsby',
      name: 'ராஷ்ட்ரிய ஸ்வாஸ்த்ய பீமா யோஜனா (RSBY)',
      shortName: 'RSBY',
      description: 'அமைப்பசாரா தொழிலாளர்கள் மற்றும் BPL குடும்பங்களுக்கான காப்பீட்டுத் திட்டம்.',
      benefits: 'மருத்துவமனையில் அனுமதிக்கப்படும் சிகிச்சைகளுக்கு குடும்பத்திற்கு ஆண்டுக்கு ₹30,000 வரை காப்பீடு.',
      eligibilitySummary: 'BPL ரேஷன் கார்டுதாரர்கள் மற்றும் குறைந்த வருமானம் உள்ள குடும்பங்கள்.',
      category: 'சுகாதார பாதுகாப்பு'
    },
    {
      id: 'pmmvy',
      name: 'பிரதான் மந்திரி மாத்ரு வந்தனா யோஜனா (PMMVY)',
      shortName: 'PMMVY',
      description: 'கர்ப்பிணி மற்றும் பாலூட்டும் தாயார்களுக்கு நிதி உதவி வழங்கும் திட்டம்.',
      benefits: 'முதல் குழந்தை பிறப்பிற்கு ₹5,000 நேரடி பண உதவி.',
      eligibilitySummary: 'குடும்பத்தின் முதல் குழந்தைக்கு கர்ப்பிணிப் பெண்கள் மற்றும் பாலூட்டும் தாய்மார்கள்.',
      category: 'தாய்மை உதவி'
    },
    {
      id: 'nhm_drugs',
      name: 'தேசிய சுகாதார திட்ட இலவச மருந்துகள் மற்றும் பரிசோதனை',
      shortName: 'NHM இலவச பராமரிப்பு',
      description: 'அரசு சுகாதார நிலையங்களில் இலவச மருந்துகள் மற்றும் ஆய்வகப் பரிசோதனை வழங்கும் திட்டம்.',
      benefits: 'ஆரம்ப சுகாதார நிலையங்களில் இலவச மருந்துகள், ரத்தப் பரிசோதனை மற்றும் இலவச ஆம்புலன்ஸ்.',
      eligibilitySummary: 'அனைத்து குடிமக்களும் பயனடையலாம்.',
      category: 'பொது சுகாதாரம்'
    }
  ]
};

export const STATIC_SCHEMES: Scheme[] = SCHEMES_BY_LANG.en;

export function matchSchemes(input: SchemeMatchInput, language: string = 'en'): SchemeMatchResult[] {
  const age = input.age ?? 30;
  const income = input.income ?? 100000;
  const isBPL = input.is_bpl ?? (income <= 120000);
  const isPregnant = input.is_pregnant ?? false;

  const langKey = (language in SCHEMES_BY_LANG) ? language : 'en';
  const schemesList = SCHEMES_BY_LANG[langKey] || SCHEMES_BY_LANG.en;

  const results: SchemeMatchResult[] = [];

  for (const scheme of schemesList) {
    let matched = false;
    let score = 0;
    const criteria: string[] = [];

    if (scheme.id === 'pmjay') {
      if (isBPL) {
        matched = true;
        score += 50;
        criteria.push(
          langKey === 'hi' ? 'बीपीएल राशन कार्ड स्थिति सत्यापित' :
          langKey === 'mr' ? 'बीपीएल रेशन कार्ड स्थिती सत्यापित' :
          langKey === 'ta' ? 'BPL ரேஷன் கார்டு சரிபார்க்கப்பட்டது' :
          'BPL Ration Card status verified'
        );
      }
      if (income <= 120000) {
        matched = true;
        score += 40;
        criteria.push(
          langKey === 'hi' ? `वार्षिक घरेलू आय (₹${income.toLocaleString('en-IN')}) ₹1.2 लाख सीमा से कम है` :
          langKey === 'mr' ? `वार्षिक उत्पन्न (₹${income.toLocaleString('en-IN')}) ₹१.२ लाख मर्यादेपेक्षा कमी आहे` :
          langKey === 'ta' ? `ஆண்டு வருமானம் (₹${income.toLocaleString('en-IN')}) ₹1.2 லட்சத்திற்கும் குறைவு` :
          `Annual household income (₹${income.toLocaleString('en-IN')}) is below the ₹1.2 Lakh threshold`
        );
      }
      if (!matched) {
        score = 20;
        criteria.push(
          langKey === 'hi' ? 'स्थानीय प्राथमिक स्वास्थ्य केंद्र पर पात्रता मूल्यांकन उपलब्ध' :
          langKey === 'mr' ? 'स्थानिक प्राथमिक आरोग्य केंद्रात पात्रता मूल्यांकन उपलब्ध' :
          langKey === 'ta' ? 'ஆரம்ப சுகாதார நிலையத்தில் தகுதி ஆய்வு வசதி உள்ளது' :
          'Universal rural eligibility assessment available at local PHC helpdesk'
        );
      }
    } else if (scheme.id === 'jsy') {
      if (isPregnant) {
        matched = true;
        score += 60;
        criteria.push(
          langKey === 'hi' ? 'वर्तमान में गर्भवती महिला जो संस्थागत प्रसव देखभाल चाहती है' :
          langKey === 'mr' ? 'सध्या गरोदर महिला जी शासकीय रुग्णालयात बाळंतपणासाठी पात्र आहे' :
          langKey === 'ta' ? 'மருத்துவமனை பிரசவத்திற்கு தகுதியான கர்ப்பிணி தாய்' :
          'Currently pregnant woman seeking institutional delivery care'
        );
      }
      if (age >= 19) {
        if (isPregnant) score += 30;
        criteria.push(
          langKey === 'hi' ? `आयु (${age} वर्ष) 19+ आयु आवश्यकता को पूरा करती है` :
          langKey === 'mr' ? `वय (${age} वर्षे) १९+ वयोमर्यादा पूर्ण करते` :
          langKey === 'ta' ? `வயது (${age}) 19+ தகுதியை பூர்த்தி செய்கிறது` :
          `Age (${age} years) satisfies the 19+ age requirement`
        );
      }
      if (isBPL && isPregnant) {
        score += 10;
        criteria.push(
          langKey === 'hi' ? 'बीपीएल मातृ नकद सहायता लागू' :
          langKey === 'mr' ? 'बीपीएल माता रोख मदत लागू' :
          langKey === 'ta' ? 'BPL தாய்மை நிதி உதவி பொருந்தும்' :
          'BPL maternal cash assistance multiplier applied'
        );
      }
    } else if (scheme.id === 'rsby') {
      if (isBPL || income <= 200000) {
        matched = true;
        score += 70;
        criteria.push(
          langKey === 'hi' ? `आय स्तर (₹${income.toLocaleString('en-IN')}/वर्ष) असंगठित क्षेत्र कार्ड के लिए पात्र है` :
          langKey === 'mr' ? `उत्पन्न मर्यादा (₹${income.toLocaleString('en-IN')}/वर्ष) कामगार कार्डसाठी पात्र आहे` :
          langKey === 'ta' ? `வருமானம் (₹${income.toLocaleString('en-IN')}) தகுதி பெறுகிறது` :
          `Income level (₹${income.toLocaleString('en-IN')}/yr) qualifies for unorganized sector state card`
        );
      } else {
        score = 30;
        criteria.push(
          langKey === 'hi' ? 'जिला श्रम विभाग में नामांकन सत्यापन के अधीन' :
          langKey === 'mr' ? 'जिल्हा कामगार विभागात नोंदणी पडताळणीच्या अधीन' :
          langKey === 'ta' ? 'மாவட்ட தொழிலாளர் துறை சரிபார்ப்பிற்கு உட்பட்டது' :
          'Subject to localized district labor department enrollment verification'
        );
      }
    } else if (scheme.id === 'pmmvy') {
      if (isPregnant) {
        matched = true;
        score += 80;
        criteria.push(
          langKey === 'hi' ? 'गर्भवती महिला ₹5,000 पोषण नकद सहायता किस्तों के लिए पात्र है' :
          langKey === 'mr' ? 'गरोदर माता ₹५,००० पोषण आर्थिक मदतीसाठी पात्र आहे' :
          langKey === 'ta' ? 'கர்ப்பிணி தாய் ₹5,000 நிதி உதவி பெற தகுதியானவர்' :
          'Pregnant mother eligible for ₹5,000 nutritional cash transfer installments'
        );
      } else {
        score = 15;
        criteria.push(
          langKey === 'hi' ? 'स्थानीय आंगनवाड़ी/पीएचसी में गर्भावस्था पंजीकरण पर लागू' :
          langKey === 'mr' ? 'स्थानिक अंगणवाडी/पीएचसीमध्ये गरोदरपणाच्या नोंदणीवर लागू' :
          langKey === 'ta' ? 'அங்கன்வாடியில் பதிவு செய்யும்போது பொருந்தும்' :
          'Applicable upon pregnancy registration at local Anganwadi/PHC'
        );
      }
    } else if (scheme.id === 'nhm_drugs') {
      // Universal
      matched = true;
      score = 95;
      criteria.push(
        langKey === 'hi' ? 'सभी नागरिक प्राथमिक स्वास्थ्य केंद्रों पर 100% मुफ़्त आवश्यक दवाओं और जांचों के लिए पात्र हैं' :
        langKey === 'mr' ? 'सर्व नागरिक प्राथमिक आरोग्य केंद्रांवर १००% मोफत औषधे व चाचण्यांसाठी पात्र आहेत' :
        langKey === 'ta' ? 'அனைத்து குடிமக்களும் ஆரம்ப சுகாதார நிலையங்களில் இலவச மருந்துகள் பெறலாம்' :
        'All rural citizens qualify for 100% free essential medicines and lab tests at PHC/CHCs'
      );
      if (isBPL) {
        criteria.push(
          langKey === 'hi' ? 'मुफ़्त पैथोलॉजी लैब पैनल और 108 एम्बुलेंस के लिए प्राथमिकता' :
          langKey === 'mr' ? 'मोफत प्रयोगशाळा चाचण्या व १०८ रुग्णवाहिकेसाठी प्राधान्य' :
          langKey === 'ta' ? 'இலவச ஆய்வக பரிசோதனை மற்றும் 108 ஆம்புலன்ஸுக்கு முன்னுரிமை' :
          'Priority access for free diagnostic lab panels and emergency ambulance (108)'
        );
      }
    }

    let qualificationReason = '';
    if (matched) {
      qualificationReason = langKey === 'hi' ? `आप पात्र हैं क्योंकि: ${criteria.join('; ')}.` :
                            langKey === 'mr' ? `तुम्ही पात्र आहात कारण: ${criteria.join('; ')}.` :
                            langKey === 'ta' ? `நீங்கள் தகுதியானவர்: ${criteria.join('; ')}.` :
                            `You qualify because: ${criteria.join('; ')}.`;
    } else {
      qualificationReason = langKey === 'hi' ? `आंशिक मिलान। आवश्यक शर्तें: ${scheme.eligibilitySummary}` :
                            langKey === 'mr' ? `अंशतः जुळणारे. आवश्यक अटी: ${scheme.eligibilitySummary}` :
                            langKey === 'ta' ? `பகுதி தகுதி. தேவைகள்: ${scheme.eligibilitySummary}` :
                            `Partial match. Prerequisites: ${scheme.eligibilitySummary}`;
    }

    results.push({
      scheme,
      matched,
      score,
      qualificationReason,
      matchedCriteria: criteria
    });
  }

  // Sort by matched first, then highest score
  return results.sort((a, b) => (b.matched ? 1 : 0) - (a.matched ? 1 : 0) || b.score - a.score);
}

