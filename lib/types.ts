export interface OcupatieResult {
  code: string;
  name: string;
  grupaMajora: string;
  subgrupaMajora: string;
  grupaMinora: string;
  grupaDeBaza: string;
  grupaMajoraName?: string;
  grupaDeBazaName?: string;
  score?: number;
}

export interface GrupaMajoraInfo {
  code: string;
  name: string;
  count: number;
}

export interface SearchResponse {
  results: OcupatieResult[];
  total: number;
  query: string;
}
