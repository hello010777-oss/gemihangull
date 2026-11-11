export type HangulCategory = 'consonant' | 'vowel' | 'double_consonant' | 'compound_vowel' | 'word' | 'custom';

export interface HangulProblem {
  id: string;
  char: string;
  name: string;
  category: HangulCategory;
  bodyTip: string;
  exampleWord: string;
  customPrompt?: string;
}

export const BASIC_CONSONANTS: HangulProblem[] = [
  { id: 'c-1', char: 'ㄱ', name: '기역', category: 'consonant', bodyTip: '팔을 옆으로 쭉 뻗고 끝을 아래로 꺾어 만들어요!', exampleWord: '가방 · 구름' },
  { id: 'c-2', char: 'ㄴ', name: '니은', category: 'consonant', bodyTip: '바닥에 앉아 다리를 앞으로 쭉 뻗어 니은 모양을 만들어요!', exampleWord: '나비 · 나무' },
  { id: 'c-3', char: 'ㄷ', name: '디귿', category: 'consonant', bodyTip: '몸을 옆으로 구부리고 팔과 다리를 뻗어 디귿을 만들어요!', exampleWord: '다람쥐 · 도토리' },
  { id: 'c-4', char: 'ㄹ', name: '리을', category: 'consonant', bodyTip: '친구와 함께 구불구불 계단 모양 리을을 만들어 볼까요?', exampleWord: '로봇 · 라디오' },
  { id: 'c-5', char: 'ㅁ', name: '미음', category: 'consonant', bodyTip: '두 팔과 두 다리를 연결해 네모난 미음 창문을 만들어요!', exampleWord: '무지개 · 모자' },
  { id: 'c-6', char: 'ㅂ', name: '비읍', category: 'consonant', bodyTip: '두 팔을 위로 올리고 친구와 손을 맞잡아 비읍을 만들어요!', exampleWord: '바나나 · 비행기' },
  { id: 'c-7', char: 'ㅅ', name: '시옷', category: 'consonant', bodyTip: '두 다리를 넓게 벌리고 씩씩하게 서서 시옷을 만들어요!', exampleWord: '사자 · 수박' },
  { id: 'c-8', char: 'ㅇ', name: '이응', category: 'consonant', bodyTip: '두 팔을 머리 위로 둥글게 모아 커다란 동그라미를 만들어요!', exampleWord: '우산 · 오리' },
  { id: 'c-9', char: 'ㅈ', name: '지읒', category: 'consonant', bodyTip: '다리를 벌려 서고 양팔을 옆으로 쭉 뻗어 지읒을 만들어요!', exampleWord: '자전거 · 자동차' },
  { id: 'c-10', char: 'ㅊ', name: '치읓', category: 'consonant', bodyTip: '지읒 모양에서 머리 위에 손가락 뿔을 하나 더 세워요!', exampleWord: '참새 · 포도' },
  { id: 'c-11', char: 'ㅋ', name: '키읔', category: 'consonant', bodyTip: '두 팔을 같은 방향으로 나란히 옆으로 뻗어 키읔을 만들어요!', exampleWord: '코끼리 · 카메라' },
  { id: 'c-12', char: 'ㅌ', name: '티읕', category: 'consonant', bodyTip: '팔과 다리를 옆으로 세 줄처럼 뻗어 티읕을 만들어요!', exampleWord: '토끼 · 타조' },
  { id: 'c-13', char: 'ㅍ', name: '피읖', category: 'consonant', bodyTip: '친구와 나란히 서서 위아래로 팔을 이어 피읖을 만들어요!', exampleWord: '포도 · 피아노' },
  { id: 'c-14', char: 'ㅎ', name: '히읗', category: 'consonant', bodyTip: '동그란 얼굴 위로 모자처럼 팔을 올려 히읗을 만들어요!', exampleWord: '하마 · 해바라기' },
];

export const BASIC_VOWELS: HangulProblem[] = [
  { id: 'v-1', char: 'ㅏ', name: '아', category: 'vowel', bodyTip: '반듯하게 서서 한쪽 팔을 오른쪽으로 톡 뻗어요!', exampleWord: '아기 · 아이스크림' },
  { id: 'v-2', char: 'ㅑ', name: '야', category: 'vowel', bodyTip: '반듯하게 서서 두 팔을 오른쪽으로 나란히 뻗어요!', exampleWord: '야구 · 야자수' },
  { id: 'v-3', char: 'ㅓ', name: '어', category: 'vowel', bodyTip: '반듯하게 서서 한쪽 팔을 왼쪽으로 톡 뻗어요!', exampleWord: '어머니 · 얼룩말' },
  { id: 'v-4', char: 'ㅕ', name: '여', category: 'vowel', bodyTip: '반듯하게 서서 두 팔을 왼쪽으로 나란히 뻗어요!', exampleWord: '여우 · 여름' },
  { id: 'v-5', char: 'ㅗ', name: '오', category: 'vowel', bodyTip: '양팔을 옆으로 벌리고 한 손을 위로 번쩍 들어요!', exampleWord: '오이 · 오징어' },
  { id: 'v-6', char: 'ㅛ', name: '요', category: 'vowel', bodyTip: '바닥에 누워 두 팔이나 두 발을 위로 나란히 들어 올려요!', exampleWord: '요리사 · 요트' },
  { id: 'v-7', char: 'ㅜ', name: '우', category: 'vowel', bodyTip: '양팔을 옆으로 쭉 뻗고 한 다리로 서서 우 모양을 만들어요!', exampleWord: '우유 · 우주선' },
  { id: 'v-8', char: 'ㅠ', name: '유', category: 'vowel', bodyTip: '양팔을 옆으로 쭉 뻗고 두 다리를 나란히 세워 유를 만들어요!', exampleWord: '유치원 · 유리창' },
  { id: 'v-9', char: 'ㅡ', name: '으', category: 'vowel', bodyTip: '양팔을 좌우로 일직선으로 길게 쭉 뻗어 으를 만들어요!', exampleWord: '으뜸 · 그네' },
  { id: 'v-10', char: 'ㅣ', name: '이', category: 'vowel', bodyTip: '차렷 자세로 머리부터 발끝까지 일자로 곧게 서요!', exampleWord: '이빨 · 이불' },
];

export const DOUBLE_CONSONANTS: HangulProblem[] = [
  { id: 'dc-1', char: 'ㄲ', name: '쌍기역', category: 'double_consonant', bodyTip: '친구 두 명이 나란히 서서 함께 기역(ㄱ) 모양을 만들어요!', exampleWord: '까치 · 꿀벌' },
  { id: 'dc-2', char: 'ㄸ', name: '쌍디귿', category: 'double_consonant', bodyTip: '친구와 둘이서 나란히 디귿(ㄷ) 모양을 만들어요!', exampleWord: '딸기 · 무당벌레' },
  { id: 'dc-3', char: 'ㅃ', name: '쌍비읍', category: 'double_consonant', bodyTip: '친구와 나란히 양손을 번쩍 들어 쌍비읍(ㅃ)을 만들어요!', exampleWord: '빵 · 오빠' },
  { id: 'dc-4', char: 'ㅆ', name: '쌍시옷', category: 'double_consonant', bodyTip: '두 친구가 나란히 다리를 벌려 쌍시옷(ㅆ)을 만들어요!', exampleWord: '씨앗 · 썰매' },
  { id: 'dc-5', char: 'ㅉ', name: '쌍지읒', category: 'double_consonant', bodyTip: '두 친구가 함께 멋지게 지읒(ㅈ) 포즈를 취해요!', exampleWord: '찌개 · 팔찌' },
];

export const COMPOUND_VOWELS: HangulProblem[] = [
  { id: 'cv-1', char: 'ㅐ', name: '애', category: 'compound_vowel', bodyTip: '친구와 나란히 서서 가운데 손을 맞잡아 애(ㅐ)를 만들어요!', exampleWord: '개구리 · 매미' },
  { id: 'cv-2', char: 'ㅒ', name: '얘', category: 'compound_vowel', bodyTip: '친구와 나란히 서서 두 팔을 위아래로 맞잡아 얘(ㅒ)를 만들어요!', exampleWord: '얘기' },
  { id: 'cv-3', char: 'ㅔ', name: '에', category: 'compound_vowel', bodyTip: '한쪽 팔을 옆으로 뻗고 친구가 옆에 나란히 서요!', exampleWord: '게 · 세수' },
  { id: 'cv-4', char: 'ㅖ', name: '예', category: 'compound_vowel', bodyTip: '두 팔을 옆으로 뻗고 친구가 옆에 반듯하게 서요!', exampleWord: '시계 · 차례' },
  { id: 'cv-5', char: 'ㅘ', name: '와', category: 'compound_vowel', bodyTip: '오(ㅗ) 모양 친구와 아(ㅏ) 모양 친구가 합쳐요!', exampleWord: '과자 · 사과' },
  { id: 'cv-6', char: 'ㅚ', name: '외', category: 'compound_vowel', bodyTip: '오(ㅗ) 모양 옆에 이(ㅣ) 모양으로 서서 만들어요!', exampleWord: '참외 · 외투' },
  { id: 'cv-7', char: 'ㅜ', name: '워', category: 'compound_vowel', bodyTip: '우(ㅜ)와 어(ㅓ)를 친구와 힘을 합쳐 만들어요!', exampleWord: '원숭이 · 정원' },
  { id: 'cv-8', char: 'ㅟ', name: '위', category: 'compound_vowel', bodyTip: '우(ㅜ) 모양 옆에 반듯하게 서서 위(ㅟ)를 만들어요!', exampleWord: '가위 · 생쥐' },
  { id: 'cv-9', char: 'ㅢ', name: '의', category: 'compound_vowel', bodyTip: '한 친구는 팔을 옆으로(ㅡ), 한 친구는 곧게(ㅣ) 서요!', exampleWord: '의자 · 의사' },
];

// Fix cv-7 char to ㅝ
COMPOUND_VOWELS[6].char = 'ㅝ';

export const FUN_WORDS: HangulProblem[] = [
  { id: 'w-1', char: '가', name: '가', category: 'word', bodyTip: '기역(ㄱ)과 아(ㅏ)를 친구와 함께 힘을 모아 만들어요!', exampleWord: '가방 · 가족' },
  { id: 'w-2', char: '나', name: '나', category: 'word', bodyTip: '니은(ㄴ)과 아(ㅏ)를 둘이서 멋지게 만들어요!', exampleWord: '나비 · 나무' },
  { id: 'w-3', char: '다', name: '다', category: 'word', bodyTip: '디귿(ㄷ)과 아(ㅏ)를 함께 표현해 볼까요?', exampleWord: '다람쥐 · 다리' },
  { id: 'w-4', char: '산', name: '산', category: 'word', bodyTip: '시옷(ㅅ), 아(ㅏ), 니은(ㄴ)으로 높은 산 글자를 만들어요!', exampleWord: '산토끼' },
  { id: 'w-5', char: '집', name: '집', category: 'word', bodyTip: '지붕 모양 지읒(ㅈ)으로 우리 집을 표현해요!', exampleWord: '우리 집' },
  { id: 'w-6', char: '♡', name: '하트', category: 'word', bodyTip: '두 팔을 머리 위로 둥글게 모아 사랑해요 하트를 만들어요!', exampleWord: '사랑해요' },
];

export const ALL_PRESET_PROBLEMS: HangulProblem[] = [
  ...BASIC_CONSONANTS,
  ...BASIC_VOWELS,
  ...DOUBLE_CONSONANTS,
  ...COMPOUND_VOWELS,
  ...FUN_WORDS,
];

const CONSONANT_SET = new Set([
  'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ',
  'ㅁ', 'ㅂ', 'ㅃ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]);

const VOWEL_SET = new Set([
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ',
  'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
]);

/**
 * Returns the natural Korean object particle ('을' or '를') for a given character or word.
 * Notice the user prompt says: "ㄱ을 만드세요!"
 * All single Korean consonants have names ending in a consonant (기역, 니은, 디귿, 리을, 미음, 비읍, 시옷, 이응, 지읒...) -> '을'
 * All single Korean vowels have names ending in a vowel (아, 야, 어, 여, 오, 요, 우, 유, 으, 이...) -> '를'
 */
export function getKoreanParticle(text: string): '을' | '를' {
  const trimmed = text.trim();
  if (!trimmed) return '을';
  const lastChar = trimmed[trimmed.length - 1];

  if (CONSONANT_SET.has(lastChar)) {
    return '을';
  }
  if (VOWEL_SET.has(lastChar)) {
    return '를';
  }

  const code = lastChar.charCodeAt(0);
  // Complete Hangul Syllable range: AC00 - D7A3
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jongseong = (code - 0xac00) % 28;
    return jongseong > 0 ? '을' : '를';
  }

  return '을';
}

export function formatPromptText(char: string, template: string): string {
  const particle = getKoreanParticle(char);
  if (template.includes('{글자}')) {
    return template
      .replace('{글자}을(를)', `${char}${particle}`)
      .replace('{글자}을', `${char}${particle}`)
      .replace('{글자}를', `${char}${particle}`)
      .replace('{글자}', char);
  }
  return `${char}${particle} 만드세요!`;
}
