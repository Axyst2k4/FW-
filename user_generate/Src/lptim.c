/**
  * File Name          : LPTIM.c
  * Description        : This file provides code for the configuration
  *                      of the LPTIM instances.
  */

/* Includes ------------------------------------------------------------------*/
#include "lptim.h"

LPTIM_HandleTypeDef hlptim1;

void MX_LPTIM1_Init(void)
{
  hlptim1.Instance = LPTIM1;
  hlptim1.Init.Clock.Source = LPTIM_CLOCKSOURCE_ULPTIM;
  hlptim1.Init.Clock.Prescaler = LPTIM_PRESCALER_DIV1;
  hlptim1.Init.UltraLowPowerClock.Polarity = LPTIM_CLOCKPOLARITY_RISING;
  hlptim1.Init.UltraLowPowerClock.SampleTime = LPTIM_CLOCKSAMPLETIME_DIRECTTRANSITION;
  hlptim1.Init.Trigger.Source = LPTIM_TRIGSOURCE_SOFTWARE;
  hlptim1.Init.OutputPolarity = LPTIM_OUTPUTPOLARITY_HIGH;
  hlptim1.Init.UpdateMode = LPTIM_UPDATE_IMMEDIATE;
  hlptim1.Init.CounterSource = LPTIM_COUNTERSOURCE_EXTERNAL;
  if (HAL_LPTIM_Init(&hlptim1) != HAL_OK)
  {
    _Error_Handler(__FILE__, __LINE__);
  }
}

void HAL_LPTIM_MspInit(LPTIM_HandleTypeDef* lptimHandle)
{

  GPIO_InitTypeDef GPIO_InitStruct;
  if(lptimHandle->Instance==LPTIM1)
  {
    /* LPTIM1 clock enable */
    __HAL_RCC_LPTIM1_CLK_ENABLE();

    /**LPTIM1 GPIO Configuration
    PB5     ------> LPTIM1_IN1
    */
    GPIO_InitStruct.Pin = GPIO_PIN_5;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF2_LPTIM1;
    HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);
  }
}

void HAL_LPTIM_MspDeInit(LPTIM_HandleTypeDef* lptimHandle)
{
  if(lptimHandle->Instance==LPTIM1)
  {
    /* Peripheral clock disable */
    __HAL_RCC_LPTIM1_CLK_DISABLE();

    /**LPTIM1 GPIO Configuration
    PB5     ------> LPTIM1_IN1
    */
    HAL_GPIO_DeInit(GPIOB, GPIO_PIN_5);
  }
}

void _Error_Handler(char * file, int line)
{
  while(1)
  {
  }
}

/************************ (C) COPYRIGHT STMicroelectronics *****END OF FILE****/
