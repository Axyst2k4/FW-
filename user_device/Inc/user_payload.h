/**
  * @file    user_payload.h
  * @author  Sagit
  * @date    Dec 24, 2023
  * @brief   
  */

#ifndef USERCODE_USER_DEVICE_INC_USER_PAYLOAD_H_
#define USERCODE_USER_DEVICE_INC_USER_PAYLOAD_H_

/* INCLUDES ------------------------------------------------------------------*/
#include "user_internal_mem.h"
#include "user_util.h"

/* MACROS AND DEFINES --------------------------------------------------------*/
#define TIME_MEASURE_SINGLE			10
#define DELAY_MEASURE_SINGLE		100
#define	TIME_MEASURE_CALIB			50
#define DELAY_MEASURE_CALIB			100

/* TYPEDEFS ------------------------------------------------------------------*/
typedef enum eDataDeviceType
{
    _DATA_NONE = 0x00,
	_DATA_JOIN,
	_DATA_ACCEPT,
	_DATA_SINGLE,
	_DATA_MULTI,
	_DATA_MODE,
	_DATA_RTC,
	_DATA_CONFIRM,
}eDataDeviceType_t;

/* EXTERNAL VARIABLES --------------------------------------------------------*/

/* GLOBAL FUNCTION PROTOTYPES ------------------------------------------------*/
void USER_Payload_Init(void);
void USER_Payload_Node_Join(uint32_t delay);
void USER_Payload_Node_Single(uint32_t delay);
void USER_Payload_Node_Calib(uint32_t delay);
void USER_Payload_Node_Mode(uint32_t delay);
void USER_Payload_Node_Confirm(uint32_t delay);
void USER_Payload_Node_Test(uint32_t delay);
void USER_Payload_Station_Accept(uint32_t delay);
void USER_Payload_Station_RTC(uint32_t delay);
void USER_Payload_Station_Mode(uint32_t delay);
void USER_Payload_Station_Confirm(uint32_t delay);
#endif /*USERCODE_USER_DEVICE_INC_USER_PAYLOAD_H_*/

/* End of file ----------------------------------------------------------------*/
