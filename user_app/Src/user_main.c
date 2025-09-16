#include "user_main.h"
#include "user_payload.h"
#include "user_define.h"
#include "radio.h"

/* Exported functions --------------------------------------------------------*/
void SysApp_Init (void)
{
	MX_GPIO_Init();

	#ifdef DEVICE_TYPE_STATION
		MX_USART1_UART_Init();
		MX_USART2_UART_Init();
	#else
		MX_USART1_UART_Init();
		MX_ADC_Init();
	#endif

	AppLora_Init ();
	UTIL_LPM_Init();
	Init_Uart_Module();
	Init_Memory_Infor();
	AppCom_Init();
}

void SysApp_Start(void)
{
	LOG(LOG_DEBUG, "Main task start");
	UTIL_TIMER_Create(&TimerLoraTx,  0xFFFFFFFFU, UTIL_TIMER_ONESHOT, _Cb_Active_Lora_Tx_Event, NULL);
	UTIL_TIMER_SetPeriod (&TimerLoraTx, sFreqInfor.FreqWakeup_u32 * 1000);
	#ifdef DEVICE_TYPE_STATION
		LED_OFF(__LED_MODE);
		Radio.Rx(RX_TIMEOUT_VALUE);
	#else
		LED_OFF(__LED_MODE);
		LED_OFF(__LED_MEASURE);
		UTIL_TIMER_Start (&TimerLoraTx);
		USER_Payload_Node_Single(sModem.TimeDelaySingle_u32);
	#endif
}

void Main_Task (void)
{
    uint8_t TaskStatus_u8 = 0;

    SysApp_Init();
    SysApp_Start();
	for (;;)
	{
		TaskStatus_u8 = 0;
		TaskStatus_u8 |= AppCom_Task();
		TaskStatus_u8 |= AppLora_Task();
	}
}
