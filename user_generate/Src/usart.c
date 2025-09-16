#include "usart.h"

#include "dma.h"

UART_HandleTypeDef huart1;
UART_HandleTypeDef huart2;
DMA_HandleTypeDef hdma_usart1_tx;
DMA_HandleTypeDef hdma_usart2_tx;

void MX_USART1_UART_Init(void)
{
	huart1.Instance = USART1;
	huart1.Init.BaudRate = 115200;
	huart1.Init.WordLength = UART_WORDLENGTH_8B;
	huart1.Init.StopBits = UART_STOPBITS_1;
	huart1.Init.Parity = UART_PARITY_NONE;
	huart1.Init.Mode = UART_MODE_TX_RX;
	huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
	huart1.Init.OverSampling = UART_OVERSAMPLING_16;
	huart1.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
	huart1.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
	if (HAL_UART_Init(&huart1) != HAL_OK)
	{
		Error_Handler();
	}
}

void MX_USART2_UART_Init(void)
{
	huart2.Instance = USART2;
	huart2.Init.BaudRate = 115200;
	huart2.Init.WordLength = UART_WORDLENGTH_8B;
	huart2.Init.StopBits = UART_STOPBITS_1;
	huart2.Init.Parity = UART_PARITY_NONE;
	huart2.Init.Mode = UART_MODE_TX_RX;
	huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
	huart2.Init.OverSampling = UART_OVERSAMPLING_16;
	huart2.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
	huart2.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
	if (HAL_UART_Init(&huart2) != HAL_OK)
	{
		Error_Handler();
	}
}

void HAL_UART_MspInit(UART_HandleTypeDef *uartHandle)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  RCC_PeriphCLKInitTypeDef PeriphClkInitStruct = {0};

  if(uartHandle->Instance==USART1)
  {
	    __HAL_RCC_USART1_CLK_ENABLE();
		__HAL_RCC_GPIOA_CLK_ENABLE();

	    PeriphClkInitStruct.PeriphClockSelection = RCC_PERIPHCLK_USART1;
	    PeriphClkInitStruct.Usart2ClockSelection = RCC_USART1CLKSOURCE_SYSCLK;
	    if (HAL_RCCEx_PeriphCLKConfig(&PeriphClkInitStruct) != HAL_OK)
	    {
	    	Error_Handler();
	    }
		/**USART1 GPIO Configuration
		PA9     ------> USART1_TX
		PA10     ------> USART1_RX
		*/
		#ifdef DEVICE_TYPE_STATION
				GPIO_InitStruct.Pin = MCU_TX_Pin|MCU_RX_Pin;
		#else
				GPIO_InitStruct.Pin = DEBUG_TX_Pin|DEBUG_RX_Pin;
		#endif
		GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
		GPIO_InitStruct.Pull = GPIO_NOPULL;
		GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
		GPIO_InitStruct.Alternate = GPIO_AF4_USART1;
		HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

	    HAL_NVIC_SetPriority(USART1_IRQn, 0, 1);
	    HAL_NVIC_EnableIRQ(USART1_IRQn);

//		__HAL_RCC_DMA1_CLK_ENABLE();
//
//	    hdma_usart1_tx.Instance                 = DMA1_Channel3;
//	    hdma_usart1_tx.Init.Request             = DMA_REQUEST_3;
//	    hdma_usart1_tx.Init.Direction           = DMA_MEMORY_TO_PERIPH;
//	    hdma_usart1_tx.Init.PeriphInc           = DMA_PINC_DISABLE;
//	    hdma_usart1_tx.Init.MemInc              = DMA_MINC_ENABLE;
//	    hdma_usart1_tx.Init.PeriphDataAlignment = DMA_PDATAALIGN_BYTE;
//	    hdma_usart1_tx.Init.MemDataAlignment    = DMA_MDATAALIGN_BYTE;
//	    hdma_usart1_tx.Init.Mode                = DMA_NORMAL;
//	    hdma_usart1_tx.Init.Priority            = DMA_PRIORITY_LOW;
//
//	    if (HAL_DMA_Init(&hdma_usart1_tx) != HAL_OK)
//	    {
//	      Error_Handler();
//	    }
//	    __HAL_LINKDMA(uartHandle, hdmatx, hdma_usart1_tx);
//
//	    HAL_NVIC_SetPriority(DMA1_Channel4_5_6_7_IRQn, 0, 1);
//	    HAL_NVIC_EnableIRQ(DMA1_Channel4_5_6_7_IRQn);
  }
  else if (uartHandle->Instance == USART2)
  {
//	#ifdef DEVICE_TYPE_STATION
	    __HAL_RCC_USART2_CLK_ENABLE();
	    __HAL_RCC_GPIOA_CLK_ENABLE();

	    PeriphClkInitStruct.PeriphClockSelection = RCC_PERIPHCLK_USART2;
	    PeriphClkInitStruct.Usart2ClockSelection = RCC_USART2CLKSOURCE_SYSCLK;
	    if (HAL_RCCEx_PeriphCLKConfig(&PeriphClkInitStruct) != HAL_OK)
	    {
	    	Error_Handler();
	    }
	    /**USART2 GPIO Configuration
	    PA2     ------> USART2_TX
	    PA3     ------> USART2_RX
	    */
	    GPIO_InitStruct.Pin = DEBUG_TX_Pin|DEBUG_RX_Pin;
	    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
	    GPIO_InitStruct.Pull = GPIO_NOPULL;
	    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
	    GPIO_InitStruct.Alternate = GPIO_AF4_USART2;
	    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

	    HAL_NVIC_SetPriority(USART2_IRQn, 0, 1);
	    HAL_NVIC_EnableIRQ(USART2_IRQn);

//		__HAL_RCC_DMA1_CLK_ENABLE();
//
//	    hdma_usart2_tx.Instance                 = DMA1_Channel5;
//	    hdma_usart2_tx.Init.Request             = DMA_REQUEST_4;
//	    hdma_usart2_tx.Init.Direction           = DMA_MEMORY_TO_PERIPH;
//	    hdma_usart2_tx.Init.PeriphInc           = DMA_PINC_DISABLE;
//	    hdma_usart2_tx.Init.MemInc              = DMA_MINC_ENABLE;
//	    hdma_usart2_tx.Init.PeriphDataAlignment = DMA_PDATAALIGN_BYTE;
//	    hdma_usart2_tx.Init.MemDataAlignment    = DMA_MDATAALIGN_BYTE;
//	    hdma_usart2_tx.Init.Mode                = DMA_NORMAL;
//	    hdma_usart2_tx.Init.Priority            = DMA_PRIORITY_LOW;
//
//	    if (HAL_DMA_Init(&hdma_usart2_tx) != HAL_OK)
//	    {
//	      Error_Handler();
//	    }
//	    __HAL_LINKDMA(uartHandle, hdmatx, hdma_usart2_tx);
//
//	    HAL_NVIC_SetPriority(DMA1_Channel2_3_IRQn, 0, 0);
//	    HAL_NVIC_EnableIRQ(DMA1_Channel2_3_IRQn);
//	#else
//	#endif
  }
}

void HAL_UART_MspDeInit(UART_HandleTypeDef *uartHandle)
{
  if(uartHandle->Instance==USART1)
  {
		__HAL_RCC_USART1_CLK_DISABLE();
		/**USART1 GPIO Configuration
		PA9     ------> USART1_TX
		PA10     ------> USART1_RX
		*/
//		#ifdef DEVICE_TYPE_STATION
//				HAL_GPIO_DeInit(GPIOA, MCU_TX_Pin|MCU_RX_Pin);
//		#else
				HAL_GPIO_DeInit(GPIOA, DEBUG_TX_Pin|DEBUG_RX_Pin);
//		#endif
	    HAL_NVIC_DisableIRQ(USART1_IRQn);
//	    HAL_DMA_DeInit(uartHandle->hdmatx);
  }
  else if (uartHandle->Instance == USART2)
  {
//	#ifdef DEVICE_TYPE_STATION
	    __HAL_RCC_USART2_CLK_DISABLE();
	    /**USART2 GPIO Configuration
	    PA2     ------> USART2_TX
	    PA3     ------> USART2_RX
	    */
	    HAL_GPIO_DeInit(GPIOA, DEBUG_TX_Pin|DEBUG_RX_Pin);
	    HAL_NVIC_DisableIRQ(USART2_IRQn);
//	    HAL_DMA_DeInit(uartHandle->hdmatx);
//	#endif
  }
}

/************************ (C) COPYRIGHT STMicroelectronics *****END OF FILE****/
