#ifndef USER_UART_H_
#define USER_UART_H_

#include "usart.h"
#include "user_struct.h"

/* Define --------------------------------------------------------------------*/
#ifdef DEVICE_TYPE_STATION
	#define uart_debug	    huart2
	#define uart_mcu	    huart1
#else
	#define uart_debug      huart1
#endif

/* External variables --------------------------------------------------------*/
extern uint8_t 	UartDebugBuff[1200];
extern sData sUartDebug;

/* Exported functions prototypes ---------------------------------------------*/
void Init_Uart_Module (void);

#endif /* USER_UART_H_ */
