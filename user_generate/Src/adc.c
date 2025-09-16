/**
  * @file    adc.c
  * @brief   This file provides code for the configuration
  *          of the ADC instances.
  */

/* Includes ------------------------------------------------------------------*/
#include "adc.h"
#include "main.h"

ADC_HandleTypeDef hadc;

void MX_ADC_Init(void)
{
	#ifdef DEVICE_TYPE_STATION
	#else
		/** Configure the global features of the ADC (Clock, Resolution, Data Alignment and number of conversion)*/
		hadc.Instance = ADC1;
		hadc.Init.OversamplingMode = DISABLE;
		hadc.Init.ClockPrescaler = ADC_CLOCK_SYNC_PCLK_DIV1;
		hadc.Init.Resolution = ADC_RESOLUTION_12B;
		hadc.Init.SamplingTime = ADC_SAMPLETIME_160CYCLES_5;
		hadc.Init.ScanConvMode = ADC_SCAN_DIRECTION_FORWARD;
		hadc.Init.DataAlign = ADC_DATAALIGN_RIGHT;
		hadc.Init.ContinuousConvMode = DISABLE;
		hadc.Init.DiscontinuousConvMode = DISABLE;
		hadc.Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;
		hadc.Init.ExternalTrigConv = ADC_SOFTWARE_START;
		hadc.Init.DMAContinuousRequests = DISABLE;
		hadc.Init.EOCSelection = ADC_EOC_SINGLE_CONV;
		hadc.Init.Overrun = ADC_OVR_DATA_PRESERVED;
		hadc.Init.LowPowerAutoWait = DISABLE;
		hadc.Init.LowPowerFrequencyMode = ENABLE;
		hadc.Init.LowPowerAutoPowerOff = DISABLE;
		if (HAL_ADC_Init(&hadc) != HAL_OK)
		{
		Error_Handler();
		}

		if (HAL_ADCEx_Calibration_Start(&hadc, ADC_SINGLE_ENDED) != HAL_OK)
		{
		Error_Handler();
		}
	#endif
}

void HAL_ADC_MspInit(ADC_HandleTypeDef* adcHandle)
{
	#ifdef DEVICE_TYPE_STATION
	#else
		GPIO_InitTypeDef GPIO_InitStruct = {0};
		if(adcHandle->Instance==ADC1)
		{
			__HAL_RCC_ADC1_CLK_ENABLE();
			__HAL_RCC_GPIOA_CLK_ENABLE();
		    GPIO_InitStruct.Pin = ADC_VNA_Pin|ADC_VP_Pin|ADC_BAT_Pin;
		    GPIO_InitStruct.Mode = GPIO_MODE_ANALOG;
		    GPIO_InitStruct.Pull = GPIO_NOPULL;
		    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
		}
	#endif
}

void HAL_ADC_MspDeInit(ADC_HandleTypeDef* adcHandle)
{
	#ifdef DEVICE_TYPE_STATION
	#else
	if(adcHandle->Instance==ADC1)
	{
		__HAL_RCC_ADC1_FORCE_RESET();
		__HAL_RCC_ADC1_RELEASE_RESET();
		__HAL_RCC_ADC1_CLK_DISABLE();
	    HAL_GPIO_DeInit(ADC_VNA_GPIO_Port, ADC_VNA_Pin);
	    HAL_GPIO_DeInit(ADC_VP_GPIO_Port, ADC_VP_Pin);
	    HAL_GPIO_DeInit(ADC_BAT_GPIO_Port, ADC_BAT_Pin);
	}
	#endif
}

/* End of file ----------------------------------------------------------------*/
