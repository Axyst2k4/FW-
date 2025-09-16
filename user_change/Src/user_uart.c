#include "user_uart.h"

/* Private variables ---------------------------------------------------------*/
uint8_t UartDebugBuff[1200] = {0};
sData 	sUartDebug = {&UartDebugBuff[0], 0};

/* Exported functions --------------------------------------------------------*/
void Init_Uart_Module (void)
{
	#ifdef DEVICE_TYPE_STATION
		__HAL_UART_ENABLE_IT(&uart_debug, UART_IT_RXNE);
		__HAL_UART_ENABLE_IT(&uart_mcu, UART_IT_RXNE);
	#else
		__HAL_UART_ENABLE_IT(&uart_debug, UART_IT_RXNE);
	#endif
}

/* End of file ----------------------------------------------------------------*/
