import { NextResponse } from 'next/server';

// Base de datos de códigos ICD-10
const icd10Database = [
  // Categoría A - Ciertas enfermedades infecciosas y parasitarias
  { code: 'A00.0', description: 'Cólera debida a Vibrio cholerae 01, biovar cholerae', category: 'A' },
  { code: 'A00.1', description: 'Cólera debida a Vibrio cholerae 01, biovar eltor', category: 'A' },
  { code: 'A01.0', description: 'Fiebre tifoidea', category: 'A' },
  { code: 'A02.0', description: 'Salmonelosis intestinal', category: 'A' },
  { code: 'A03.0', description: 'Shigelosis por Shigella dysenteriae', category: 'A' },
  { code: 'A04.5', description: 'Enteritis por Campylobacter', category: 'A' },
  { code: 'A08.0', description: 'Enteritis viral', category: 'A' },
  { code: 'A09', description: 'Otras gastroenteritis y colitis', category: 'A' },
  
  // Categoría B - Ciertas enfermedades virales
  { code: 'B00.0', description: 'Eczema herpético', category: 'B' },
  { code: 'B01.0', description: 'Varicela meningitis', category: 'B' },
  { code: 'B02.0', description: 'Encefalitis herpes zoster', category: 'B' },
  { code: 'B20.0', description: 'Enfermedad por VIH resulting in infectious', category: 'B' },
  
  // Categoría C - Tumores [neoplasias]
  { code: 'C00.0', description: 'Tumor maligno del labio inferior', category: 'C' },
  { code: 'C50.9', description: 'Tumor maligno de mama, no especificado', category: 'C' },
  { code: 'C61.9', description: 'Tumor maligno de prostata, no especificado', category: 'C' },
  
  // Categoría D - Enfermedades de la sangre y ciertos trastornos inmunitarios
  { code: 'D50.9', description: 'Anemia por deficiencia de hierro, no especificada', category: 'D' },
  { code: 'D64.9', description: 'Anemia, no especificada', category: 'D' },
  
  // Categoría E - Enfermedades endocrinas, nutricionales y metabólicas
  { code: 'E10.9', description: 'Diabetes mellitus tipo 1 sin complicaciones', category: 'E' },
  { code: 'E11.9', description: 'Diabetes mellitus tipo 2 sin complicaciones', category: 'E' },
  { code: 'E66.0', description: 'Obesidad debida a exceso de calorías', category: 'E' },
  { code: 'E78.0', description: 'Hipercolesterolemia pura', category: 'E' },
  { code: 'E78.5', description: 'Hipertrigliceridemia', category: 'E' },
  
  // Categoría F - Trastornos mentales y conductuales
  { code: 'F32.0', description: 'Episodio depresivo leve', category: 'F' },
  { code: 'F32.1', description: 'Episodio depresivo moderado', category: 'F' },
  { code: 'F33.0', description: 'Trastorno depresivo recurrente, episodio actual leve', category: 'F' },
  { code: 'F41.0', description: 'Trastorno de pánico', category: 'F' },
  { code: 'F41.1', description: 'Trastorno de ansiedad generalizada', category: 'F' },
  
  // Categoría G - Enfermedades del sistema nervioso
  { code: 'G40.9', description: 'Epilepsia, no especificada', category: 'G' },
  { code: 'G43.9', description: 'Migraña, no especificada', category: 'G' },
  { code: 'G44.1', description: 'Cefalea vascular', category: 'G' },
  { code: 'G45.9', description: 'Enfermedad cerebrovascular, no especificada', category: 'G' },
  
  // Categoría H - Enfermedades del ojo y sus anexos
  { code: 'H10.9', description: 'Conjuntivitis, no especificada', category: 'H' },
  { code: 'H25.9', description: 'Catarata senil, no especificada', category: 'H' },
  
  // Categoría I - Enfermedades del sistema circulatorio
  { code: 'I10', description: 'Hipertensión esencial', category: 'I' },
  { code: 'I11.9', description: 'Enfermedad cardíaca hipertensiva sin insuficiencia cardíaca', category: 'I' },
  { code: 'I20.0', description: 'Angina de pecho inestable', category: 'I' },
  { code: 'I21.3', description: 'Infarto agudo de miocardio', category: 'I' },
  { code: 'I48.0', description: 'Fibrilación auricular paroxística', category: 'I' },
  { code: 'I50.9', description: 'Insuficiencia cardíaca, no especificada', category: 'I' },
  
  // Categoría J - Enfermedades del sistema respiratorio
  { code: 'J00', description: 'Rinitis aguda', category: 'J' },
  { code: 'J01.9', description: 'Sinusitis aguda, no especificada', category: 'J' },
  { code: 'J02.0', description: 'Faringitis estreptocócica', category: 'J' },
  { code: 'J03.9', description: 'Amigdalitis aguda, no especificada', category: 'J' },
  { code: 'J04.1', description: 'Laringitis aguda', category: 'J' },
  { code: 'J06.9', description: 'Infección respiratoria aguda, no especificada', category: 'J' },
  { code: 'J10.0', description: 'Gripe con neumonía', category: 'J' },
  { code: 'J11.0', description: 'Gripe con neumonía', category: 'J' },
  { code: 'J18.9', description: 'Neumonía, no especificada', category: 'J' },
  { code: 'J20.9', description: 'Bronquitis aguda, no especificada', category: 'J' },
  { code: 'J40', description: 'Bronquitis, no especificada como aguda o crónica', category: 'J' },
  { code: 'J44.9', description: 'Enfermedad pulmonar obstructiva crónica, no especificada', category: 'J' },
  { code: 'J45.9', description: 'Asma, no especificada', category: 'J' },
  
  // Categoría K - Enfermedades del sistema digestivo
  { code: 'K08.1', description: 'Pérdida de dientes', category: 'K' },
  { code: 'K21.0', description: 'Enfermedad por reflujo gastroesofágico con esofagitis', category: 'K' },
  { code: 'K29.7', description: 'Gastritis, no especificada', category: 'K' },
  { code: 'K30', description: 'Dispepsia', category: 'K' },
  { code: 'K35.2', description: 'Apendicitis aguda con peritonitis generalizada', category: 'K' },
  { code: 'K50.0', description: 'Enfermedad de Crohn del intestino delgado', category: 'K' },
  { code: 'K51.9', description: 'Colitis ulcerosa, no especificada', category: 'K' },
  { code: 'K57.2', description: 'Enfermedad diverticular del colon con perforación', category: 'K' },
  { code: 'K80.2', description: 'Cálculos biliares con otras colecistitis', category: 'K' },
  { code: 'K81.9', description: 'Colecistitis, no especificada', category: 'K' },
  { code: 'K85.9', description: 'Pancreatitis aguda, no especificada', category: 'K' },
  
  // Categoría L - Enfermedades de la piel y el tejido subcutáneo
  { code: 'L20.9', description: 'Dermatitis atópica, no especificada', category: 'L' },
  { code: 'L23.9', description: 'Dermatitis alérgica de contacto, no especificada', category: 'L' },
  { code: 'L30.9', description: 'Dermatitis, no especificada', category: 'L' },
  { code: 'L70.9', description: 'Acné, no especificado', category: 'L' },
  
  // Categoría M - Enfermedades del sistema musculoesquelético
  { code: 'M16.9', description: 'Artrosis de cadera, no especificada', category: 'M' },
  { code: 'M17.9', description: 'Artrosis de rodilla, no especificada', category: 'M' },
  { code: 'M25.5', description: 'Dolor articular', category: 'M' },
  { code: 'M54.5', description: 'Lumbago', category: 'M' },
  { code: 'M79.1', description: 'Mialgia', category: 'M' },
  { code: 'M79.6', description: 'Dolor en extremidad', category: 'M' },
  
  // Categoría N - Enfermedades del sistema genitourinario
  { code: 'N10', description: 'Nefritis tubulointersticial aguda', category: 'N' },
  { code: 'N30.0', description: 'Cistitis aguda', category: 'N' },
  { code: 'N34.1', description: 'Uretritis no especificada', category: 'N' },
  { code: 'N39.0', description: 'Infección de vías urinarias, no especificada', category: 'N' },
  { code: 'N40', description: 'Hiperplasia de prostata', category: 'N' },
  { code: 'N63', description: 'Masa mamaria no especificada', category: 'N' },
  { code: 'N89.9', description: 'Trastorno vaginal no especificado', category: 'N' },
  
  // Categoría O - Embarazo, parto y puerperio
  { code: 'O09.0', description: 'Supervisión de embarazo molar', category: 'O' },
  { code: 'O09.1', description: 'Supervisión de embarazo ectópico', category: 'O' },
  
  // Categoría Q - Malformaciones congénitas
  { code: 'Q90.9', descripción: 'Síndrome de Down, no especificado', category: 'Q' },
  
  // Categoría R - Síntomas, signos y hallazgos anormales
  { code: 'R05', description: 'Tos', category: 'R' },
  { code: 'R06.0', description: 'Disnea', category: 'R' },
  { code: 'R10.9', description: 'Dolor abdominal, no especificado', category: 'R' },
  { code: 'R11.0', description: 'Náuseas', category: 'R' },
  { code: 'R11.1', description: 'Vómito', category: 'R' },
  { code: 'R21', description: 'Erupción cutánea', category: 'R' },
  { code: 'R50.9', description: 'Fiebre, no especificada', category: 'R' },
  { code: 'R51', description: 'Cefalea', category: 'R' },
  { code: 'R53', description: 'Malestar y fatiga', category: 'R' },
  
  // Categoría S - Lesiones, traumatismos
  { code: 'S01.0', description: 'Herida del cuero cabelludo', category: 'S' },
  { code: 'S61.9', description: 'Herida de dedo(s) de la mano', category: 'S' },
  
  // Categoría Z - Factores que influyen en la salud
  { code: 'Z00.0', description: 'Examen general médico', category: 'Z' },
  { code: 'Z00.1', description: 'Examen de recepción y empleo', category: 'Z' },
  { code: 'Z00.6', description: 'Examen para comparación con población normal', category: 'Z' },
  { code: 'Z30.2', description: 'Estérilización (mujer)', category: 'Z' },
  { code: 'Z71.3', description: 'Asesoramiento dietético', category: 'Z' },
  { code: 'Z71.8', description: 'Otro asesoramiento médico especificado', category: 'Z' },
  { code: 'Z99.1', description: 'Dependencia de respirador', category: 'Z' },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ codes: [] });
    }

    const queryLower = query.toLowerCase();
    
    // Filtrar códigos que coincidan con la búsqueda
    const results = icd10Database.filter(item => 
      item.code.toLowerCase().includes(queryLower) ||
      item.description.toLowerCase().includes(queryLower)
    );

    return NextResponse.json({ codes: results.slice(0, 20) });
  } catch (error) {
    console.error('Error buscando códigos ICD-10:', error);
    return NextResponse.json(
      { error: 'Error al buscar códigos ICD-10' },
      { status: 500 }
    );
  }
}
