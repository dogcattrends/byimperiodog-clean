export type SearchSuggestItem = {
  url: string;
  title: string;
  reason: string;
};

export type SearchSuggestResponse = {
  suggestions: SearchSuggestItem[];
};
