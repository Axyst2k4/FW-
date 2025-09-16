/**
  * @file    user_payload.c
  * @author  Sagit
  * @date    Dec 24, 2023
  * @brief   
  */

/* INCLUDES ------------------------------------------------------------------*/
#include "user_time.h"
#include "sys_app.h"
#include "user_define.h"
#include "user_modem.h"
#include "user_time.h"
#include "user_lora.h"
#include "user_util.h"
#include "user_payload.h"
/* EXTERN VARIABLES ----------------------------------------------------------*/

/* PRIVATE MACROS AND DEFINES ------------------------------------------------*/

/* PRIVATE TYPEDEFS ----------------------------------------------------------*/

/* STATIC VARIABLES ----------------------------------------------------------*/

/* GLOBAL VARIABLES ----------------------------------------------------------*/

/* STATIC FUNCTION PROTOTYPES --- --------------------------------------------*/

/* STATIC FUNCTIONS ----------------------------------------------------------*/

/* GLOBAL FUNCTIONS ----------------------------------------------------------*/
void USER_Payload_Init(void)
{

}

void USER_Payload_Node_Single(uint32_t delay)
{
	/* Init */
	LOG(LOG_DEBUG, "USER_Payload_Node_Single");
	uint8_t     pData[128] = {0};
	uint8_t     length = 0;
	uint8_t     TempCrc = 0;
	uint16_t	i = 0;
	uint16_t	Value_Measure_Single_VP = 0;
	uint16_t	Value_Measure_Single_VNA = 0;
	uint16_t	Value_Measure_Battery = 0;

	/* Measure */
	for( i = 0; i < TIME_MEASURE_SINGLE; i++)
	{
		Value_Measure_Single_VNA += Get_Vol_VNA();
		Value_Measure_Single_VP += Get_Vol_VP();
		HAL_Delay(DELAY_MEASURE_SINGLE);
		LED_TOGGLE(__LED_MEASURE);
	}
	Value_Measure_Single_VNA /= TIME_MEASURE_SINGLE;
	Value_Measure_Single_VP /= TIME_MEASURE_SINGLE;
	Value_Measure_Battery = Get_Vol_BAT();

	/* Packet */
	pData[length++] = OBIS_ID_SENSOR;
	pData[length++] = sModem.sDCU_id.Length_u16;

	for (i = 0; i < sModem.sDCU_id.Length_u16; i++)
		pData[length++] = *(sModem.sDCU_id.Data_a8 + i);

	pData[length++] = OBIS_VOL_VNA;
	pData[length++] = 0x02;
	pData[length++] = (Value_Measure_Single_VNA >> 8) & 0xFF;
	pData[length++] = Value_Measure_Single_VNA & 0xFF;

	pData[length++] = OBIS_VOL_VP;
	pData[length++] = 0x02;
	pData[length++] = (Value_Measure_Single_VP >> 8) & 0xFF;
	pData[length++] = Value_Measure_Single_VP & 0xFF;

	pData[length++] = OBIS_VOL_BAT;
	pData[length++] = 0x01;
	pData[length++] = Value_Measure_Battery & 0xFF;
	pData[length++] = 0x00;

	length++;
	for (i = 0; i < (length - 1); i++)
		TempCrc ^= pData[i];

	pData[length-1] = TempCrc;

	LED_OFF(__LED_MEASURE);
	/* Send */
	sModem.bNeedConfirm = DATA_CONFIRMED_UP;
	sModem.TypeDataMessage = _DATA_SINGLE;
	AppLora_Send(pData, length, DATA_CONFIRMED_UP, _DATA_SINGLE, delay);
}

void USER_Payload_Node_Calib(uint32_t delay)
{
	/* Init */
	LOG(LOG_DEBUG, "USER_Payload_Node_Calib");
	uint8_t     pData[128] = {0};
	uint8_t     length = 0;
	uint8_t     TempCrc = 0;
	uint16_t     i = 0;
	uint8_t		Value_Measure_Calib[TIME_MEASURE_CALIB*2];
	uint16_t	Value;
	uint8_t		Pos = 0;

	/* Measure */
	for(i = 0; i < TIME_MEASURE_CALIB; i++)
	{
		switch(sModem.TypeModem_u8)
		{
			case _LORA_NODE_VNA:
				Value = Get_Vol_VNA();
				break;
			case _LORA_NODE_VP:
				Value = Get_Vol_VP();
				break;
			default:
				break;
		}
		Value_Measure_Calib[Pos++] = (uint8_t) (Value >> 8);
		Value_Measure_Calib[Pos++] = (uint8_t) Value;
		HAL_Delay(DELAY_MEASURE_CALIB);
		LED_TOGGLE(__LED_MEASURE);
	}

	/* Packet */
	pData[length++] = OBIS_ID_SENSOR;
	pData[length++] = sModem.sDCU_id.Length_u16;

	for (i = 0; i < sModem.sDCU_id.Length_u16; i++)
		pData[length++] = *(sModem.sDCU_id.Data_a8 + i);

	if (sModem.TypeModem_u8 == _LORA_NODE_VNA)
	{
		pData[length++] = OBIS_VOL_VNA;
	} else if (sModem.TypeModem_u8 == _LORA_NODE_VP)
	{
		pData[length++] = OBIS_VOL_VP;
	}
	pData[length++] = 0x64;
	for (i = 0; i < 100; i++)
	{
		pData[length++] = Value_Measure_Calib[i];
	}
	pData[length++] = 0x00;

	length++;
	for (i = 0; i < (length - 1); i++)
		TempCrc ^= pData[i];

	pData[length-1] = TempCrc;
	LED_OFF(__LED_MEASURE);

	/* Send */
	sModem.bNeedConfirm = DATA_CONFIRMED_UP;
	sModem.TypeDataMessage = _DATA_MULTI;
	AppLora_Send(pData, length, DATA_CONFIRMED_UP, _DATA_MULTI, delay);
}

void USER_Payload_Node_Mode(uint32_t delay)
{
	/* Init */
	LOG(LOG_DEBUG, "USER_Payload_Node_Mode");
	uint8_t     pData[128] = {0};
	uint8_t     length = 0;
	uint8_t     TempCrc = 0;
	uint16_t	i = 0;

	/* Packet */
	pData[length++] = OBIS_ID_SENSOR;
	pData[length++] = sModem.sDCU_id.Length_u16;

	for (i = 0; i < sModem.sDCU_id.Length_u16; i++)
		pData[length++] = *(sModem.sDCU_id.Data_a8 + i);

	pData[length++] = OBIS_MODE;
	pData[length++] = 0x01;
	pData[length++] = sModem.Mode & 0xFF;
	pData[length++] = 0x00;

	length++;
	for (i = 0; i < (length - 1); i++)
		TempCrc ^= pData[i];

	pData[length-1] = TempCrc;

	/* Send */
	sModem.bNeedConfirm = DATA_CONFIRMED_UP;
	sModem.TypeDataMessage = _DATA_MODE;
	AppLora_Send(pData, length, DATA_CONFIRMED_UP, _DATA_MODE, delay);
}

void USER_Payload_Node_Join(uint32_t delay)
{
	/* Init */
	LOG(LOG_DEBUG, "USER_Payload_Node_Join");
	uint8_t     pData[128] = {0};
	uint8_t     length = 0;
	uint8_t     TempCrc = 0;
	uint16_t	i = 0;

	/* Packet */
	pData[length++] = OBIS_ID_SENSOR;
	pData[length++] = sModem.sDCU_id.Length_u16;

	for (i = 0; i < sModem.sDCU_id.Length_u16; i++)
		pData[length++] = *(sModem.sDCU_id.Data_a8 + i);

	pData[length++] = OBIS_MODE;
	pData[length++] = 0x01;
	pData[length++] = sModem.Mode & 0xFF;
	pData[length++] = 0x00;

	length++;
	for (i = 0; i < (length - 1); i++)
		TempCrc ^= pData[i];

	pData[length-1] = TempCrc;

	/* Send */
	sModem.bNeedConfirm = DATA_UNCONFIRMED_UP;
	sModem.TypeDataMessage = _DATA_JOIN;
	AppLora_Send(pData, length, DATA_UNCONFIRMED_UP, _DATA_JOIN, delay);
}

void USER_Payload_Node_Test(uint32_t delay)
{
	/* Init */
	LOG(LOG_DEBUG, "USER_Payload_Node_Test");
	uint8_t     pData[128] = {0};
    uint8_t     length = 0;
    uint16_t	i = 0;
    uint8_t     TempCrc = 0;

    /* Packet */
    pData[length++] = OBIS_ID_SENSOR;
    pData[length++] = sModem.sDCU_id.Length_u16;

    for (i = 0; i < sModem.sDCU_id.Length_u16; i++)
        pData[length++] = *(sModem.sDCU_id.Data_a8 + i);

    pData[length++] = OBIS_CONFIRM;
    pData[length++] = 0x00;

    length++;
	for (i = 0; i < (length - 1); i++)
		TempCrc ^= pData[i];

    pData[length-1] = TempCrc;

    /* Send */
	sModem.bNeedConfirm = DATA_UNCONFIRMED_UP;
	sModem.TypeDataMessage = _DATA_NONE;
	AppLora_Send(pData, length, DATA_UNCONFIRMED_UP, _DATA_NONE, delay);
}

void USER_Payload_Node_Confirm(uint32_t delay)
{
	/* Init */
	LOG(LOG_DEBUG, "USER_Payload_Node_Confirm");
	uint8_t     pData[128] = {0};
    uint8_t     length = 0;
    uint16_t	i = 0;
    uint8_t     TempCrc = 0;

    /* Packet */
    pData[length++] = OBIS_ID_SENSOR;
    pData[length++] = sModem.sDCU_id.Length_u16;

    for (i = 0; i < sModem.sDCU_id.Length_u16; i++)
        pData[length++] = *(sModem.sDCU_id.Data_a8 + i);

    pData[length++] = OBIS_CONFIRM;
    pData[length++] = 0x00;

    length++;
	for (i = 0; i < (length - 1); i++)
		TempCrc ^= pData[i];

    pData[length-1] = TempCrc;

    /* Send */
	sModem.bNeedConfirm = DATA_UNCONFIRMED_UP;
	sModem.TypeDataMessage = _DATA_CONFIRM;
	AppLora_Send(pData, length, DATA_UNCONFIRMED_UP, _DATA_CONFIRM, delay);
}

void USER_Payload_Station_RTC(uint32_t delay)
{
	/* Init */
	LOG(LOG_DEBUG, "USER_Payload_Station_RTC");
	uint8_t     pData[128] = {0};
    uint8_t     length = 0;
    uint16_t	i = 0;
    uint8_t     TempCrc = 0;

    /* Measure */
    Get_RTC();

    /* Packet */
    pData[length++] = OBIS_ID_STATION;
    pData[length++] = sModem.sDCU_id.Length_u16;

    for (i = 0; i < sModem.sDCU_id.Length_u16; i++)
        pData[length++] = *(sModem.sDCU_id.Data_a8 + i);

    pData[length++] = OBIS_TIME;
    pData[length++] = 0x06;
    pData[length++] = sRTC.year;
    pData[length++] = sRTC.month;
    pData[length++] = sRTC.date;
    pData[length++] = sRTC.hour;
    pData[length++] = sRTC.min;
    pData[length++] = sRTC.sec;

    pData[length++] = 0x00;

    length++;
	for (i = 0; i < (length - 1); i++)
		TempCrc ^= pData[i];

    pData[length-1] = TempCrc;

    /* Send */
	sModem.bNeedConfirm = DATA_CONFIRMED_DOWN;
	sModem.TypeDataMessage = _DATA_RTC;
	AppLora_Send(pData, length, DATA_CONFIRMED_DOWN, _DATA_RTC, delay);
}

void USER_Payload_Station_Mode(uint32_t delay)
{
	/* Init */
	LOG(LOG_DEBUG, "USER_Payload_Station_Mode");
	uint8_t     pData[128] = {0};
	uint8_t     length = 0;
	uint8_t     TempCrc = 0;
	uint16_t	i = 0;

	/* Packet */
	pData[length++] = OBIS_ID_STATION;
	pData[length++] = sModem.sDCU_id.Length_u16;

	for (i = 0; i < sModem.sDCU_id.Length_u16; i++)
		pData[length++] = *(sModem.sDCU_id.Data_a8 + i);

	pData[length++] = OBIS_MODE;
	pData[length++] = 0x01;
	pData[length++] = sModem.Mode & 0xFF;
	pData[length++] = 0x00;

	length++;
	for (i = 0; i < (length - 1); i++)
		TempCrc ^= pData[i];

	pData[length-1] = TempCrc;

	/* Send */
	sModem.bNeedConfirm = DATA_CONFIRMED_DOWN;
	sModem.TypeDataMessage = _DATA_MODE;
	AppLora_Send(pData, length, DATA_CONFIRMED_DOWN, _DATA_MODE, delay);
}

void USER_Payload_Station_Confirm(uint32_t delay)
{
	/* Init */
	LOG(LOG_DEBUG, "USER_Payload_Station_Confirm");
	uint8_t     pData[128] = {0};
    uint8_t     length = 0;
    uint16_t	i = 0;
    uint8_t     TempCrc = 0;

    /* Packet */
    pData[length++] = OBIS_ID_STATION;
    pData[length++] = sModem.sDCU_id.Length_u16;

    for (i = 0; i < sModem.sDCU_id.Length_u16; i++)
        pData[length++] = *(sModem.sDCU_id.Data_a8 + i);

    pData[length++] = OBIS_CONFIRM;
    pData[length++] = 0x00;

    length++;
	for (i = 0; i < (length - 1); i++)
		TempCrc ^= pData[i];

    pData[length-1] = TempCrc;

    /* Send */
	sModem.bNeedConfirm = DATA_UNCONFIRMED_DOWN;
	sModem.TypeDataMessage = _DATA_CONFIRM;
	AppLora_Send(pData, length, DATA_UNCONFIRMED_DOWN, _DATA_CONFIRM, delay);
}

void USER_Payload_Station_Accept(uint32_t delay)
{
	/* Init */
	LOG(LOG_DEBUG, "USER_Payload_Station_Accecpt");
	uint8_t     pData[128] = {0};
    uint8_t     length = 0;
    uint16_t	i = 0;
    uint8_t     TempCrc = 0;

    /* Packet */
    pData[length++] = OBIS_ID_STATION;
    pData[length++] = sModem.sDCU_id.Length_u16;

    for (i = 0; i < sModem.sDCU_id.Length_u16; i++)
        pData[length++] = *(sModem.sDCU_id.Data_a8 + i);

    pData[length++] = OBIS_CONFIRM;
    pData[length++] = 0x00;

    length++;
	for (i = 0; i < (length - 1); i++)
		TempCrc ^= pData[i];

    pData[length-1] = TempCrc;

    /* Send */
	sModem.bNeedConfirm = DATA_UNCONFIRMED_DOWN;
	sModem.TypeDataMessage = _DATA_ACCEPT;
	AppLora_Send(pData, length, DATA_UNCONFIRMED_DOWN, _DATA_ACCEPT, delay);
}
/* End of file ----------------------------------------------------------------*/
