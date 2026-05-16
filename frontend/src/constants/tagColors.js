export const TAG_COLORS = {
  '해커톤':   '#dfc6f9',
  '프로젝트': '#bde1fd',
  '스터디':   '#c5e9d8',
  '공모전':   '#fcd5e5',
  '장학/취업': '#fde68a',
};

export const TAG_TEXT_COLORS = {
  '해커톤':   '#725494',
  '프로젝트': '#465b66',
  '스터디':   '#547165',
  '공모전':   '#bd718f',
  '장학/취업': '#7d7040',
};

// 우측 패널 칩 전용 색상 (테두리 + 글자)
export const TAG_CHIP_COLORS = {
  '해커톤':   '#8b6fbd',
  '프로젝트': '#7bacd1',
  '스터디':   '#8fc2aa',
  '공모전':   '#dfa8be',
  '장학/취업': '#dfc971',
};

export const FALLBACK_TAG_COLOR      = '#e7e9ee';
export const FALLBACK_TAG_TEXT_COLOR = '#383642';

export function getTagColor(tags) {
  for (const tag of (tags ?? [])) {
    if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  }
  return FALLBACK_TAG_COLOR;
}
