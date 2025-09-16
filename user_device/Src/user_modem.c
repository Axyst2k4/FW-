#include "user_rtc.h"
#include "user_modem.h"
#include "user_payload.h"
#include "user_adc.h"
#include "user_define.h"
#include "i2c.h"
#include "user_flash.h"
#include "radio.h"

/* External variables ---------------------------------------------------------*/
ST_TIME_FORMAT          sRTCSet = {0};
uint8_t aDCU_ID[MAX_DCU_ID_LENGTH] = DCUID;
uint8_t aNET_ID[MAX_DCU_ID_LENGTH] = NETID;

uint8_t aAT_CMD [LEGNTH_AT_SERIAL];
uint8_t aMULTI_MESS [LENGTH_MULTI_TX];
uint8_t aBACKUP[255];

Struct_Modem_Variable		sModem =
{
	.sDCU_id    		= {&aDCU_ID[0], 4},
	.sNET_id			= {&aNET_ID[0], 4},
	.strATCmd   		= {&aAT_CMD[0], 0},
	.sBackup			= {&aBACKUP[0], 0},
	.bNeedConfirm		= 0,
	.TimeTrySendAgain	= 0,
	.TypeDataMessage	= _DATA_NONE,
	#ifdef DEVICE_TYPE_STATION
		.Mode				= _MODE_SLEEP,
	#else
		.Mode				= _MODE_SLEEP,
	#endif
	.SendAll			= 0,
};

SModemFreqActionInformation     sFreqInfor =
{
    .NumWakeup_u8           = DEFAULT_NUMBER_WAKE_UP,
    .FreqWakeup_u32         = DEFAULT_FREQ_WAKEUP,
};

StructpFuncLPM 					sModemLPMHandler =
{
    .LPM_Deinit_Peripheral = 		Modem_Deinit_Peripheral,
    .LPM_Init_Peripheral = 			Modem_Init_Peripheral,
    .LPM_Deinit_Before_IRQ_Handle = Modem_Deinit_Before_IRQ_Handle,
    .LPM_Init_Before_IRQ_Handle = 	Modem_Init_Before_IRQ_Handle,
};

/* Exported functions --------------------------------------------------------*/
void Reset_Chip_Immediately (void)
{
	__disable_irq();
	NVIC_SystemReset();
}

void DCU_Response_AT(uint8_t *data, uint16_t length)
{
	HAL_UART_Transmit(&uart_debug, data, length, 1000);
	HAL_UART_Transmit(&uart_debug, (uint8_t*)"\r\n", 2, 1000);
#ifdef DEVICE_TYPE_STATION
	HAL_UART_Transmit(&uart_mcu, data, length, 1000);
#endif
}

void Modem_Deinit_Peripheral (void)
{
    MX_GPIO_DeInit();
	ADC_Desequence_Powerhungry_Channels();
    HAL_ADC_DeInit(&hadc);

	#ifdef DEVICE_TYPE_STATION
    	__HAL_UART_DISABLE_IT(&uart_mcu, UART_IT_RXNE);
    	HAL_UART_DeInit(&uart_mcu);

    	__HAL_UART_DISABLE_IT(&uart_debug, UART_IT_RXNE);
    	HAL_UART_DeInit(&uart_debug);
	#else
    	__HAL_UART_DISABLE_IT(&uart_debug, UART_IT_RXNE);
    	HAL_UART_DeInit(&uart_debug);

    	HAL_I2C_DeInit(&hi2c1);

	#endif
}

void Modem_Init_Peripheral (void)
{
    Modem_Init_Gpio_Again();
    AdcInitialized = 0;

	#ifdef DEVICE_TYPE_STATION
    	MX_USART1_UART_Init();
    	__HAL_UART_ENABLE_IT(&uart_mcu, UART_IT_RXNE);

    	MX_USART2_UART_Init();
    	__HAL_UART_ENABLE_IT(&uart_debug, UART_IT_RXNE);
	#else
    	MX_USART1_UART_Init();
    	__HAL_UART_ENABLE_IT(&uart_debug, UART_IT_RXNE);

    	MX_I2C1_Init();

	#endif
}

void Modem_Init_Before_IRQ_Handle (void)
{
	AppLora_Init_IO_Radio();
}

void Modem_Deinit_Before_IRQ_Handle (void)
{
	AppLora_Deinit_IO_Radio();
}

void MX_GPIO_DeInit(void)
{
	#ifdef DEVICE_TYPE_STATION
		GPIO_InitTypeDef GPIO_InitStruct ={0};

		__HAL_RCC_GPIOA_CLK_ENABLE();
		__HAL_RCC_GPIOB_CLK_ENABLE();

		GPIO_InitStruct.Mode   = GPIO_MODE_ANALOG;
		GPIO_InitStruct.Pull   = GPIO_NOPULL;

		GPIO_InitStruct.Pin = LED_BLUE_Pin;
		HAL_GPIO_Init(LED_BLUE_GPIO_Port, &GPIO_InitStruct);
	#else
		GPIO_InitTypeDef GPIO_InitStruct ={0};

		__HAL_RCC_GPIOA_CLK_ENABLE();
		__HAL_RCC_GPIOB_CLK_ENABLE();

		GPIO_InitStruct.Mode   = GPIO_MODE_ANALOG;
		GPIO_InitStruct.Pull   = GPIO_NOPULL;

		GPIO_InitStruct.Pin = RTC_RST_Pin|LED_GREEN_Pin|LED_BLUE_Pin;
		HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);

		  /* Disable GPIOs clock */
		__HAL_RCC_GPIOA_CLK_DISABLE();
		__HAL_RCC_GPIOB_CLK_DISABLE();
	#endif
}

void Modem_Init_Gpio_Again(void)
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

		/* GPIO Ports Clock Enable */
		__HAL_RCC_GPIOA_CLK_ENABLE();
		__HAL_RCC_GPIOB_CLK_ENABLE();

		/*Configure GPIO pin Output Level */
		HAL_GPIO_WritePin(GPIOB, RTC_RST_Pin|LED_GREEN_Pin|LED_BLUE_Pin, GPIO_PIN_RESET);

		/*Configure GPIO pins : PBPin PBPin PBPin */
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
	#endif
}

void Init_Memory_Infor(void)
{
    Init_Timer_Send();
    Init_Device_Type();
	Init_ID(0);
	Init_ID(1);
}

/**
 * @param	0: DCU_ID
 * 			1: NET_ID
 */
void Init_ID(uint8_t type)
{
    uint8_t temp = 0;
    if(type == 0)
    {
    	temp = *(__IO uint8_t*) ADDR_DCUID;
    	if (temp != FLASH_BYTE_EMPTY)
    	{
            Flash_Get_Infor ((ADDR_DCUID + 1), sModem.sDCU_id.Data_a8, &sModem.sDCU_id.Length_u16, 10);
    	} else
    	{
    		Save_ID(type);
    	}
    } else
    {
    	temp = *(__IO uint8_t*) ADDR_NETID;
    	if (temp != FLASH_BYTE_EMPTY)
    	{
            Flash_Get_Infor ((ADDR_NETID + 1), sModem.sNET_id.Data_a8, &sModem.sNET_id.Length_u16, 10);
    	} else
    	{
    		Save_ID(type);
    	}
    }
}

/**
 * @param	0: DCU_ID
 * 			1: NET_ID
 */
void Save_ID(uint8_t type)
{
    uint8_t i=0;
	uint8_t temp_arr[40] = {0};

	if(type == 0)
	{
		temp_arr[0] = BYTE_TEMP_FIRST;
		temp_arr[1] = sModem.sDCU_id.Length_u16;

		for (i = 0;i < sModem.sDCU_id.Length_u16; i++)
			temp_arr[i+2] = sModem.sDCU_id.Data_a8[i];

		OnchipFlashPageErase(ADDR_DCUID);
		OnchipFlashWriteData(ADDR_DCUID, temp_arr, 40);
	} else
	{
		temp_arr[0] = BYTE_TEMP_FIRST;
		temp_arr[1] = sModem.sNET_id.Length_u16;

		for (i = 0;i < sModem.sNET_id.Length_u16; i++)
			temp_arr[i+2] = sModem.sNET_id.Data_a8[i];

		OnchipFlashPageErase(ADDR_NETID);
		OnchipFlashWriteData(ADDR_NETID, temp_arr, 40);
	}
}

void Init_Timer_Send (void)
{
    uint8_t     temp = 0;
    uint8_t 	Buff_temp[24] = {0};
    uint8_t 	Length = 0;

    temp = *(__IO uint8_t*) (ADDR_FREQ_ACTIVE);
    if (temp != FLASH_BYTE_EMPTY)
    {
        OnchipFlashReadData(ADDR_FREQ_ACTIVE, &Buff_temp[0], 24);
        Length = Buff_temp[1];
        if (Length < 24)
        {
            sFreqInfor.NumWakeup_u8 = Buff_temp[2];
            sFreqInfor.FreqWakeup_u32 = Buff_temp[3];
            sFreqInfor.FreqWakeup_u32 = (sFreqInfor.FreqWakeup_u32 << 8) | Buff_temp[4];
        }
    } else
    {
        Save_Freq_Send_Data();
    }
}

void Save_Freq_Send_Data (void)
{
    uint8_t Buff_temp[24] = {0};

    Buff_temp[0] = BYTE_TEMP_FIRST;
    Buff_temp[1] = 3;
    Buff_temp[2] = sFreqInfor.NumWakeup_u8;

    Buff_temp[3] = (sFreqInfor.FreqWakeup_u32 >> 8) & 0xFF;
    Buff_temp[4] = sFreqInfor.FreqWakeup_u32 & 0xFF;

    Erase_Firmware(ADDR_FREQ_ACTIVE, 1);
    OnchipFlashWriteData(ADDR_FREQ_ACTIVE, &Buff_temp[0], 16);
}

void Init_Device_Type (void)
{
    uint8_t     temp = 0;
    uint8_t 	Buff_temp[24] = {0};
    uint8_t 	Length = 0;

    temp = *(__IO uint8_t*) (ADDR_DEVICE_TYPE);
    if (temp != FLASH_BYTE_EMPTY)
    {
        OnchipFlashReadData(ADDR_DEVICE_TYPE, &Buff_temp[0], 24);
        Length = Buff_temp[1];
        if (Length < 24)
        {
            sModem.TypeModem_u8 = Buff_temp[2];
        }
    } else
    {
        Save_Device_Type();
    }
}

void Save_Device_Type (void)
{
    uint8_t Buff_temp[24] = {0};

    Buff_temp[0] = BYTE_TEMP_FIRST;
    Buff_temp[1] = 1;
    Buff_temp[2] = sModem.TypeModem_u8;

    Erase_Firmware(ADDR_DEVICE_TYPE, 1);
    OnchipFlashWriteData(ADDR_DEVICE_TYPE, &Buff_temp[0], 16);
}

/* End of file ----------------------------------------------------------------*/
