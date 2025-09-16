#ifndef USER_RTC_H
#define USER_RTC_H

#include "user_timer.h"
#include "user_util.h"

/* Define --------------------------------------------------------------------*/
#ifndef RTC_N_PREDIV_S
    #define RTC_N_PREDIV_S 			10
    #define RTC_PREDIV_S 			((1 << RTC_N_PREDIV_S) - 1)
    #define RTC_PREDIV_A 			((1 << (15-RTC_N_PREDIV_S)) - 1)
#endif

#define MIN_ALARM_DELAY            	3 /* in ticks */

/* RTC Ticks/ms conversion */
#define RTC_BKP_SECONDS    		RTC_BKP_DR0
#define RTC_BKP_SUBSECONDS 		RTC_BKP_DR1
#define RTC_BKP_MSBTICKS   		RTC_BKP_DR2

/* Sub-second mask definition  */
#define RTC_ALARMSUBSECONDMASK    RTC_N_PREDIV_S<<RTC_ALRMASSR_MASKSS_Pos

/* RTC Time base in us */
#define USEC_NUMBER             1000000
#define MSEC_NUMBER             (USEC_NUMBER / 1000)

#define COMMON_FACTOR        	3
#define CONV_NUMER              (MSEC_NUMBER >> COMMON_FACTOR)
#define CONV_DENOM              (1 << (RTC_N_PREDIV_S - COMMON_FACTOR))

#ifndef DAYS_IN_LEAP_YEAR
    #define DAYS_IN_LEAP_YEAR                       ( ( uint32_t )  366U )
    #define DAYS_IN_YEAR                            ( ( uint32_t )  365U )
    #define SECONDS_IN_1DAY                         ( ( uint32_t )86400U )
    #define SECONDS_IN_1HOUR                        ( ( uint32_t ) 3600U )
    #define SECONDS_IN_1MINUTE                      ( ( uint32_t )   60U )
    #define MINUTES_IN_1HOUR                        ( ( uint32_t )   60U )
    #define HOURS_IN_1DAY                           ( ( uint32_t )   24U )
    #define DIVC( X, N )                            ( ( ( X ) + ( N ) -1 ) / ( N ) )
#endif

#define DAYS_IN_MONTH_CORRECTION_NORM           ((uint32_t) 0x99AAA0 )
#define DAYS_IN_MONTH_CORRECTION_LEAP           ((uint32_t) 0x445550 )

/* Exported types ------------------------------------------------------------*/
typedef struct
{
	uint32_t Rtc_Time; /* Reference time */
	RTC_TimeTypeDef RTC_Calndr_Time; /* Reference time in calendar format */
	RTC_DateTypeDef RTC_Calndr_Date; /* Reference date in calendar format */
} RtcTimerContext_t;

/* Exported functions prototypes ---------------------------------------------*/
UTIL_TIMER_Status_t 	RTC_IF_Init(void);
UTIL_TIMER_Status_t 	RTC_IF_StartTimer(uint32_t timeout);
UTIL_TIMER_Status_t 	RTC_IF_StopTimer(void);

uint32_t 	RTC_IF_SetTimerContext(void);
uint32_t 	RTC_IF_GetTimerContext(void);
uint32_t 	RTC_IF_GetTimerElapsedTime(void);
uint32_t 	RTC_IF_GetTimerValue(void);
uint32_t 	RTC_IF_GetMinimumTimeout(void);
void 		RTC_IF_DelayMs(uint32_t delay);
uint32_t 	RTC_IF_Convert_ms2Tick(uint32_t timeMilliSec);
uint32_t 	RTC_IF_Convert_Tick2ms(uint32_t tick);
uint32_t 	RTC_IF_GetTime(uint16_t *subSeconds);
void 		RTC_IF_BkUp_Write_Seconds(uint32_t Seconds);
uint32_t 	RTC_IF_BkUp_Read_Seconds(void);
void 		RTC_IF_BkUp_Write_SubSeconds(uint32_t SubSeconds);
uint32_t 	RTC_IF_BkUp_Read_SubSeconds(void);
extern void (*pModemProcessIRQTimer) (void);

#endif /* USER_RTC_H */
