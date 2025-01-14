import { BirdeyeService } from '../BirdeyeService';
import { GetTokenPriceResponse, GetPortfolioResponse } from '../types';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BirdeyeService', () => {
  const mockConfig = {
    apiKey: 'test-api-key'
  };

  let service: BirdeyeService;

  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios);
    service = new BirdeyeService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTokenPrice', () => {
    it('should fetch token price successfully', async () => {
      const mockResponse: { data: GetTokenPriceResponse } = {
        data: {
          success: true,
          data: {
            value: 1.23,
            updateUnixTime: 1234567890,
            updateTime: '2024-01-13T00:00:00Z'
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getTokenPrice({ address: 'token-address' });

      expect(mockedAxios.get).toHaveBeenCalledWith('/public/price?address=token-address');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle errors properly', async () => {
      const mockError = {
        response: {
          data: {
            success: false,
            message: 'API Error',
            code: 'ERROR_CODE'
          },
          status: 400
        }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(service.getTokenPrice({ address: 'token-address' })).rejects.toThrow('API Error');
    });
  });

  describe('getPortfolio', () => {
    it('should fetch portfolio successfully', async () => {
      const mockResponse: { data: GetPortfolioResponse } = {
        data: {
          success: true,
          data: {
            wallet: '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621',
            totalUsd: 177417911.42802328,
            items: [
              {
                address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
                balance: '72938605011215',
                uiAmount: 72938605.011215,
                chainId: 'ethereum',
                logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png?1668148663',
                priceUsd: 1.0000259715445037,
                valueUsd: 72940499.33944109
              }
            ]
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getPortfolio({ 
        wallet: '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621',
        network: 'ethereum'
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/v1/wallet/token_list?wallet=0xf584f8728b874a6a5c7a8d4d387c9aae9172d621',
        {
          headers: {
            'x-chain': 'ethereum'
          }
        }
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle portfolio errors properly', async () => {
      const mockError = {
        response: {
          data: {
            success: false,
            message: 'Invalid wallet address',
            code: 'INVALID_WALLET'
          },
          status: 400
        }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(
        service.getPortfolio({ 
          wallet: 'invalid-address',
          network: 'ethereum'
        })
      ).rejects.toThrow('Invalid wallet address');
    });
  });
}); 