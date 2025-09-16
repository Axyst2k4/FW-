#include "user_adc.h"
#include "stm32l0xx_hal_adc_ex.h"
#include "user_define.h"

/* Private variables ---------------------------------------------------------*/
uint8_t AdcInitialized = 0;

/*===================== Funcion ===================== */
void STM32_MX_ADC1_Init(void)
{
    ADC_ChannelConfTypeDef sConfig = {0};
    hadc1.Instance = ADC1;
    hadc1.Init.Resolution = ADC_RESOLUTION_12B;
    hadc1.Init.DataAlign = ADC_DATAALIGN_RIGHT;
    hadc1.Init.ScanConvMode = ADC_SCAN_ENABLE;
    hadc1.Init.EOCSelection = ADC_EOC_SINGLE_CONV;
    hadc1.Init.LowPowerAutoWait = DISABLE;
    hadc1.Init.ContinuousConvMode = DISABLE;
    hadc1.Init.ClockPrescaler = ADC_CLOCK_SYNC_PCLK_DIV4;
    hadc1.Init.SamplingTime = ADC_SAMPLETIME_160CYCLES_5;
    hadc1.Init.LowPowerFrequencyMode = ENABLE;
    hadc1.Init.LowPowerAutoPowerOff = DISABLE;
    hadc1.Init.DiscontinuousConvMode = DISABLE;
    hadc1.Init.ExternalTrigConv = ADC_SOFTWARE_START;
    hadc1.Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;
    hadc1.Init.DMAContinuousRequests = DISABLE;
    hadc1.Init.Overrun = ADC_OVR_DATA_PRESERVED;
    hadc1.Init.OversamplingMode = DISABLE;
    if (HAL_ADC_Init(&hadc1) != HAL_OK)
    {
        Error_Handler();
    }

    if (HAL_ADCEx_Calibration_Start(&hadc1, ADC_SINGLE_ENDED) != HAL_OK)
    {
        Error_Handler();
    }
    sConfig.Channel = ADC_CHANNEL_VREFINT;
    sConfig.Rank = ADC_RANK_CHANNEL_NUMBER;
    if (HAL_ADC_ConfigChannel(&hadc1, &sConfig) != HAL_OK)
    {
        Error_Handler();
    }
}

uint16_t HW_AdcReadChannel (uint32_t Channel)
{
    ADC_ChannelConfTypeDef  sConfig;
    uint16_t adcData = 0;

	STM32_MX_ADC1_Init();

	 /* wait the the Vrefint used by adc is set */
	while (__HAL_PWR_GET_FLAG(PWR_FLAG_VREFINTRDY) == RESET) {};

	__HAL_RCC_ADC1_CLK_ENABLE() ;

	/*calibrate ADC if any calibraiton hardware*/
	HAL_ADCEx_Calibration_Start(&hadc1, ADC_SINGLE_ENDED);

	/* Deselects all channels*/
	sConfig.Channel = ADC_CHANNEL_MASK;
	sConfig.Rank = ADC_RANK_NONE;
	HAL_ADC_ConfigChannel( &hadc1, &sConfig);

	/* configure adc channel */
	sConfig.Channel = Channel;
	sConfig.Rank = ADC_RANK_CHANNEL_NUMBER;
	HAL_ADC_ConfigChannel( &hadc1, &sConfig);

	/* Start the conversion process */
	if (HAL_ADC_Start(&hadc) != HAL_OK)
	{
		/* Start Error */
		Error_Handler();
	}
	/* Wait for the end of conversion */
	HAL_ADC_PollForConversion( &hadc1, HAL_MAX_DELAY );

	HAL_ADC_Stop(&hadc1) ;   /* it calls also ADC_Disable() */
	/* Get the converted value of regular channel */
	adcData = HAL_ADC_GetValue ( &hadc1);
	 HAL_ADC_DeInit(&hadc1);
	__HAL_RCC_ADC1_CLK_DISABLE() ;
    return adcData;
}

void ADC_Desequence_Powerhungry_Channels(void)
{
#if defined (STM32L072xx) || defined (STM32L082xx)
     ADC_ChannelConfTypeDef sConfig;

    sConfig.Channel = ADC_CHANNEL_TEMPSENSOR;
    sConfig.Rank = ADC_RANK_NONE;
    HAL_ADC_ConfigChannel (&hadc1, &sConfig);

    sConfig.Channel = ADC_CHANNEL_VREFINT;
    sConfig.Rank = ADC_RANK_NONE;
    HAL_ADC_ConfigChannel (&hadc1, &sConfig);
#endif
}

uint16_t Get_Vol_VNA (void)
{
	uint16_t Value_ADC_u16;
	uint16_t Temp_mV = 0;
    Value_ADC_u16 = HW_AdcReadChannel(ADC_CHANNEL_2);
	Temp_mV = (VREF * Value_ADC_u16) / 4095 + DEFAULT_OFFSET_ADC_VNA / 2;
	return Temp_mV;
}

uint16_t Get_Vol_VP (void)
{
	uint16_t Value_ADC_u16;
	uint16_t Temp_mV = 0;
    Value_ADC_u16 = HW_AdcReadChannel(ADC_CHANNEL_3);
	Temp_mV = (VREF * Value_ADC_u16) / 4095 + DEFAULT_OFFSET_ADC_VP / 2;
	return Temp_mV;
}

uint8_t Get_Vol_BAT (void)
{
	uint16_t Value_ADC_u16;
	float Temp_mV = 0;
	float PercentBat;
    Value_ADC_u16 = HW_AdcReadChannel(ADC_CHANNEL_4);
	Temp_mV = (VREF * Value_ADC_u16) / 4095.0 / 1000.0 * 2;
	PercentBat = 579*Temp_mV*Temp_mV - 1936*Temp_mV + 2089 - 55*Temp_mV*Temp_mV*Temp_mV;
	return PercentBat;
}

uint16_t Get_Level_Voltage (uint32_t Vol_mV, uint32_t VMAX, uint32_t VMIN)
{
    uint16_t batteryLevel = 0;

    if (Vol_mV > VMAX)
        batteryLevel = LEVEL_MAX_BAT;
    else if (Vol_mV < VMIN)
        batteryLevel = 0;
	else
        batteryLevel = ( ( (uint32_t) (Vol_mV - VMIN) * LEVEL_MAX_BAT ) / (VMAX - VMIN) );
	return batteryLevel;
}

/* End of file ----------------------------------------------------------------*/
