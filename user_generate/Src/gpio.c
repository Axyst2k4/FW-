/**
  * File Name          : gpio.c
  * Description        : This file provides code for the configuration
  *                      of all used GPIO pins.
  */

/* Includes ------------------------------------------------------------------*/
#include "gpio.h"

/* Exported functions --------------------------------------------------------*/
void MX_GPIO_Init(void)
{
	#ifdef DEVICE_TYPE_STATION
		GPIO_InitTypeDef GPIO_InitStruct = {0};

		/* GPIO Ports Clock Enable */
		__HAL_RCC_GPIOA_CLK_ENABLE();
		__HAL_RCC_GPIOB_CLK_ENABLE();

		/*Configure GPIO pin Output Level */
		HAL_GPIO_WritePin(LED_BLUE_GPIO_Port, LED_BLUE_Pin, GPIO_PIN_RESET);

		/*Configure GPIO pin : PtPin */
		GPIO_InitStruct.Pin = LED_BLUE_Pin;
		GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
		GPIO_InitStruct.Pull = GPIO_NOPULL;
		GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
		HAL_GPIO_Init(LED_BLUE_GPIO_Port, &GPIO_InitStruct);
	#else
		GPIO_InitTypeDef GPIO_InitStruct = {0};

		__HAL_RCC_GPIOA_CLK_ENABLE();
		__HAL_RCC_GPIOB_CLK_ENABLE();

		HAL_GPIO_WritePin(GPIOB, RTC_RST_Pin|LED_GREEN_Pin|LED_BLUE_Pin, GPIO_PIN_SET);

		GPIO_InitStruct.Pin = RTC_INT_Pin;
		GPIO_InitStruct.Mode = GPIO_MODE_IT_RISING;
		GPIO_InitStruct.Pull = GPIO_NOPULL;
		HAL_GPIO_Init(RTC_INT_GPIO_Port, &GPIO_InitStruct);

		GPIO_InitStruct.Pin = RTC_RST_Pin|LED_GREEN_Pin|LED_BLUE_Pin;
		GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
		GPIO_InitStruct.Pull = GPIO_NOPULL;
		GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
		HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);

		__HAL_RCC_ADC1_CLK_ENABLE();
		__HAL_RCC_GPIOA_CLK_ENABLE();
		GPIO_InitStruct.Pin = ADC_VNA_Pin|ADC_VP_Pin|ADC_BAT_Pin;
		GPIO_InitStruct.Mode = GPIO_MODE_ANALOG;
		GPIO_InitStruct.Pull = GPIO_NOPULL;
		HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

		HAL_NVIC_SetPriority(EXTI4_15_IRQn, 1, 0);
		HAL_NVIC_EnableIRQ(EXTI4_15_IRQn);
		#endif
}

/************************ (C) COPYRIGHT STMicroelectronics *****END OF FILE****/
