#ifndef USER_TIME_H
#define USER_TIME_H

#include "user_rtc.h"
#include "user_util.h"

/* External variables --------------------------------------------------------*/
extern RTC_HandleTypeDef hrtc;
extern const uint16_t   days[4][12];

/* Exported functions prototypes ---------------------------------------------*/
void            Get_RTC(void);
uint8_t         Set_RTC(ST_TIME_FORMAT sRTC_Var);
uint8_t         Check_update_Time(ST_TIME_FORMAT *sRTC_temp);

void            Convert_sTime_ToGMT (ST_TIME_FORMAT* sRTC_Check, uint8_t GMT);
uint32_t        HW_RTC_GetCalendarValue_Second( ST_TIME_FORMAT sTimeRTC);

void 			Set_Alarm_Defaut_Time (uint8_t time_hour,uint8_t time_min, uint8_t time_sec);
void 			Set_Alarm_For_Time (uint8_t time_hour,uint8_t time_min, uint8_t time_sec);
void 			Set_Alarm_DCU (uint8_t time_hour,uint8_t time_min, uint8_t time_sec);


#endif /* USER_TIME_H */

