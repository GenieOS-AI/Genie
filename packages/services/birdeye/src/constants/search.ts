import { SearchNetwork } from '../types/request';

export const SORT_BY = {
    VOLUME_24H_USD: 'volume_24h_usd'
} as const;

export const SORT_TYPE = {
    ASC: 'asc',
    DESC: 'desc'
} as const;

export const TARGET_TYPE = {
    ALL: 'all',
    TOKEN: 'token'
} as const;

export const SEARCH_DEFAULTS = {
    CHAIN: 'all' as SearchNetwork,
    TARGET: TARGET_TYPE.ALL,
    SORT_BY: SORT_BY.VOLUME_24H_USD,
    SORT_TYPE: SORT_TYPE.DESC,
    OFFSET: 0,
    LIMIT: 20
} as const; 