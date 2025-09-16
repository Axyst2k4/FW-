#ifndef INC_USER_DEFINE_H_
#define INC_USER_DEFINE_H_

#include "user_main.h"

#define INC_APP_COMMON_FEATURE

#ifdef INC_APP_COMMON_FEATURE
    #include "user_common.h"
#endif

#define INC_APP_LORA_FEATURE

#ifdef INC_APP_LORA_FEATURE
    #include "user_lora.h"
#endif

#include "user_at.h"
#include "user_internal_mem.h"
#include "user_obis.h"
#include "user_uart.h"

#include "user_modem.h"
#include "gpio.h"

#include "user_event_drive.h"
#include "user_struct.h"
#include "user_time.h"

#include "sys_app.h"
/* Define --------------------------------------------------------------------*/
#define UART_BAURATE									115200

#define DEFAULT_FREQ_WAKEUP                             300
#define DEFAULT_NUMBER_WAKE_UP                          1
#define DEFAULT_OFFSET_ADC_VP							30		// unit mV
#define DEFAULT_OFFSET_ADC_VNA							30		// unit mV
#define DEFAULT_OFFSET_ADC_VBAT							0		// unit mV

#define DEFAULT_TIME_SINGLE_DELAY						8
#define DEFAULT_TIME_CALIB_DELAY						8
#define DEFAULT_TIME_NETWORK_DELAY						5

#define MAX_NUMBER_WAKE_UP                              10
#define MAX_NUNBER_SEND_INIT                            1
#define MAX_MESS_IN_PACKET                              1       //1 ban tin 31 byte. Max 512 byte - 45 byte header

/*--- ID cua thiet bi -------*/
#ifdef DEVICE_TYPE_STATION
    #define NETID                                    	"N001"
    #define DCUID										"S001"
#else
    #define NETID                                   	"N001"
	#define DCUID										"T082"
#endif

#endif /* INC_USER_DEFINE_H_ */
