#include "user_at.h"

#include "user_define.h"
#include "user_flash.h"
#include "user_string.h"
#include "user_payload.h"
/* Exported types ------------------------------------------------------------*/
const struct_CheckList_AT CheckList_AT_CONFIG[] =
{
	//id ENUM				kind process				str Received
	{_AT_SET_DEVICE_ID, 	_fAT_SET_DEVICE_ID,		    {(uint8_t*)"at+devid=",9}},
	{_AT_GET_DEVICE_ID,		_fAT_GET_DEVICE_ID,		    {(uint8_t*)"at+devid?",9}},

	{_AT_SET_NETWORK_ID, 	_fAT_SET_NETWORK_ID,		{(uint8_t*)"at+netid=",9}},
	{_AT_GET_NETWORK_ID,	_fAT_GET_NETWORK_ID,		{(uint8_t*)"at+netid?",9}},

	{_AT_SET_DUTY_WAKEUP, 	_fAT_SET_DUTY_WAKEUP,		{(uint8_t*)"at+duty=",8}},
	{_AT_GET_DUTY_WAKEUP,	_fAT_GET_DUTY_WAKEUP,		{(uint8_t*)"at+duty?",8}},

	{_AT_SET_TYPE_MODEM, 	_fAT_SET_TYPE_MODEM,		{(uint8_t*)"at+type=",8}},
	{_AT_GET_TYPE_MODEM,	_fAT_GET_TYPE_MODEM,		{(uint8_t*)"at+type?",8}},

	{_AT_SET_RTC, 			_fAT_SET_RTC,		    	{(uint8_t*)"at+rtc=",7}},
	{_AT_GET_RTC,			_fAT_GET_RTC,		    	{(uint8_t*)"at+rtc?",7}},

	{_AT_RESET_MODEM, 		_fAT_RESET_MODEM,		    {(uint8_t*)"at+reset?",9}},
	{_AT_SET_LED,			_fAT_SET_LED,		    	{(uint8_t*)"at+led=",7}},
	{_AT_SET_MODE, 			_fAT_SET_MODE,		    	{(uint8_t*)"at+mode=",8}},
	{_AT_GET_FIRM_VER,		_fAT_GET_FIRM_VER,		    {(uint8_t*)"at+version?",11}},
	{_AT_GET_AUTHOR,		_fAT_GET_AUTHOR,		    {(uint8_t*)"at+author?",10}},

	{_END_AT_CMD,	        NULL,	                    {(uint8_t*)"at+end",6}},
};

uint8_t 		aDATA_CONFIG[128];

/* Exported functions prototypes ---------------------------------------------*/
uint8_t Check_AT_User(sData *StrUartRecei)
{
	uint8_t var;
	int Pos_Str = -1;
	uint16_t i = 0;
	sData sDataConfig = {&aDATA_CONFIG[0], 0};

	for (i = 0; i < StrUartRecei->Length_u16; i++)
	{
		if ((*(StrUartRecei->Data_a8 + i) == '=') || (*(StrUartRecei->Data_a8 + i) == '?'))
		{
			break;
		}

		if ((*(StrUartRecei->Data_a8 + i) >= 0x41) && (*(StrUartRecei->Data_a8 + i) <= 0x5A))
		{
			*(StrUartRecei->Data_a8 + i) = *(StrUartRecei->Data_a8 + i) + 0x20;
		}
	}

	for (var = _AT_SET_DEVICE_ID; var <= _END_AT_CMD; var++)
	{
		Pos_Str = Find_String_V2((sData*) &CheckList_AT_CONFIG[var].sTempReceiver, StrUartRecei);
		if ((Pos_Str >= 0) && (CheckList_AT_CONFIG[var].CallBack != NULL))
		{
			Reset_Buff(&sModem.strATCmd);
			for (i = 0; i <(StrUartRecei->Length_u16 - Pos_Str); i++)
			{
				if ((*(StrUartRecei->Data_a8 + Pos_Str + i) == '?') || (*(StrUartRecei->Data_a8+Pos_Str+i) == '=') \
						|| (sModem.strATCmd.Length_u16 >= LEGNTH_AT_SERIAL))
				{
					break;
				} else
				{
					*(sModem.strATCmd.Data_a8 + sModem.strATCmd.Length_u16++) = *(StrUartRecei->Data_a8+Pos_Str+i);
				}
			}

			Pos_Str += CheckList_AT_CONFIG[var].sTempReceiver.Length_u16;

			for (i = Pos_Str; i < StrUartRecei->Length_u16; i++)
			{
				if (*(StrUartRecei->Data_a8 + i) == 0x0D)
				{
					if ( (i < (StrUartRecei->Length_u16 - 1)) && (*(StrUartRecei->Data_a8 + i + 1) == 0x0A) )
					{
						break;
					}
				}

				if ( sDataConfig.Length_u16 < sizeof(aDATA_CONFIG) )
				{
					*(sDataConfig.Data_a8 + sDataConfig.Length_u16++) = *(StrUartRecei->Data_a8 + i);
				}
			}

			CheckList_AT_CONFIG[var].CallBack(&sDataConfig, 0);
			return 1;
		}
	}
	return 0;
}

/* Private functions definition -----------------------------------------------*/
void _fAT_SET_DEVICE_ID(sData *str_Receivv, uint16_t Pos)
{
    uint8_t i=0;

    if (str_Receivv->Length_u16 <= (Pos + 20))
    {
    	DCU_Response_AT ((uint8_t *)"OK", 2);
        UTIL_MEM_set(&aDCU_ID, 0, sizeof(aDCU_ID));
        sModem.sDCU_id.Length_u16 = 0;
        for (i = Pos; i < (str_Receivv->Length_u16); i++)
        {
            if (sModem.sDCU_id.Length_u16 >= sizeof(aDCU_ID))
            {
                break;
            }
        	sModem.sDCU_id.Data_a8[sModem.sDCU_id.Length_u16++] = *(str_Receivv->Data_a8 + i);
        }
        Save_ID(0);
        Reset_Chip_Immediately();
    } else
    	DCU_Response_AT((uint8_t *)"FAIL", 4);
}

void _fAT_GET_DEVICE_ID(sData *str_Receiv, uint16_t Pos)
{
    DCU_Response_AT(sModem.sDCU_id.Data_a8, sModem.sDCU_id.Length_u16);
}

void _fAT_SET_NETWORK_ID(sData *str_Receiv, uint16_t Pos)
{
    uint8_t i=0;

    if (str_Receiv->Length_u16 <= (Pos + 20))
    {
    	DCU_Response_AT ((uint8_t *)"OK", 2);
        UTIL_MEM_set(&aNET_ID, 0, sizeof(aNET_ID));
        sModem.sNET_id.Length_u16 = 0;
        for (i = Pos; i < (str_Receiv->Length_u16); i++)
        {
            if (sModem.sNET_id.Length_u16 >= sizeof(aNET_ID))
            {
                break;
            }
        	sModem.sNET_id.Data_a8[sModem.sNET_id.Length_u16++] = *(str_Receiv->Data_a8 + i);
        }
        Save_ID(1);
        Reset_Chip_Immediately();
    } else
    	DCU_Response_AT((uint8_t *)"FAIL", 4);
}

void _fAT_GET_NETWORK_ID(sData *str_Receiv, uint16_t Pos)
{
    DCU_Response_AT(sModem.sNET_id.Data_a8, sModem.sNET_id.Length_u16);
}

void _fAT_SET_DUTY_WAKEUP(sData *str_Receiv, uint16_t Pos)
{
    uint16_t TempFre = 0;
    uint8_t TempNum = 0;

    if (str_Receiv->Length_u16 < (Pos + 5))
    {
        DCU_Response_AT((uint8_t *)"FAIL", 4);
        return;
    }
    TempNum = *(str_Receiv->Data_a8 + Pos++) - 0x30;
    TempNum = TempNum * 10 + *(str_Receiv->Data_a8 + Pos++) - 0x30;
    Pos++;
    TempFre = *(str_Receiv->Data_a8 + Pos++) - 0x30;
    TempFre = TempFre * 10 + *(str_Receiv->Data_a8 + Pos++) - 0x30;

    if (((TempNum > 0) && (TempNum <= MAX_NUMBER_WAKE_UP)) && (TempFre <= 100))
    {
        sFreqInfor.NumWakeup_u8 = TempNum;
        sFreqInfor.FreqWakeup_u32 = TempFre;

        Save_Freq_Send_Data();
        Reset_Chip_Immediately();
        DCU_Response_AT ((uint8_t *)"OK", 2);
    } else
    	DCU_Response_AT((uint8_t *)"ERROR", 5);
}

void _fAT_GET_DUTY_WAKEUP(sData *str_Receiv, uint16_t Pos)
{
    uint8_t     length = 0;
    uint8_t     aTemp[14] = {0};

    aTemp[length++] = 'F';
    aTemp[length++] = 'R';
    aTemp[length++] = 'E';
    aTemp[length++] = 'Q';
    aTemp[length++] = '=';
    aTemp[length++] = sFreqInfor.NumWakeup_u8 / 10 + 0x30;
    aTemp[length++] = sFreqInfor.NumWakeup_u8 % 10 + 0x30;
    aTemp[length++] = 'x';
    aTemp[length++] = (sFreqInfor.FreqWakeup_u32  / 10) % 10 + 0x30;
    aTemp[length++] = sFreqInfor.FreqWakeup_u32  % 10 + 0x30;

    DCU_Response_AT(&aTemp[0], length);
}

void _fAT_SET_TYPE_MODEM(sData *str_Receiv, uint16_t Pos)
{
    uint8_t TempNum = 0;

    if (str_Receiv->Length_u16 < (Pos + 1))
    {
        DCU_Response_AT((uint8_t *)"FAIL", 4);
        return;
    }
    TempNum = *(str_Receiv->Data_a8 + Pos++) - 0x30;

	#ifdef DEVICE_TYPE_STATION
		if (TempNum == 2)
		{
			sModem.TypeModem_u8 = _LORA_STATION;
			Save_Device_Type();
			DCU_Response_AT ((uint8_t *)"OK", 2);
		} else
		{
			DCU_Response_AT((uint8_t *)"ERROR", 5);
		}
	#else
		if (TempNum == 0)
		{
			sModem.TypeModem_u8 = _LORA_NODE_VNA;
			Save_Device_Type();
			DCU_Response_AT ((uint8_t *)"OK", 2);
		} else if (TempNum == 1)
		{
			sModem.TypeModem_u8 = _LORA_NODE_VP;
			Save_Device_Type();
			DCU_Response_AT ((uint8_t *)"OK", 2);
		} else
		{
			DCU_Response_AT((uint8_t *)"ERROR", 5);
		}
	#endif
}

void _fAT_GET_TYPE_MODEM(sData *str_Receiv, uint16_t Pos)
{
    uint8_t     length = 0;
    uint8_t     aTemp[50] = {0};

    aTemp[length++] = 'T';
    aTemp[length++] = 'Y';
    aTemp[length++] = 'P';
    aTemp[length++] = 'E';
    aTemp[length++] = ':';
    aTemp[length++] = ' ';
    switch (sModem.TypeModem_u8)
    {
    	case _LORA_NODE_VNA:
    	    aTemp[length++] = 'N';
    	    aTemp[length++] = 'O';
    	    aTemp[length++] = 'D';
    	    aTemp[length++] = 'E';
    	    aTemp[length++] = ' ';
    	    aTemp[length++] = 'V';
    	    aTemp[length++] = 'N';
    	    aTemp[length++] = 'A';
    	case _LORA_NODE_VP:
    	    aTemp[length++] = 'N';
    	    aTemp[length++] = 'O';
    	    aTemp[length++] = 'D';
    	    aTemp[length++] = 'E';
    	    aTemp[length++] = ' ';
    	    aTemp[length++] = 'V';
    	    aTemp[length++] = 'P';
    	case _LORA_STATION:
    	    aTemp[length++] = 'S';
    	    aTemp[length++] = 'T';
    	    aTemp[length++] = 'A';
    	    aTemp[length++] = 'T';
    	    aTemp[length++] = 'I';
    	    aTemp[length++] = 'O';
    	    aTemp[length++] = 'N';
    }
    DCU_Response_AT(&aTemp[0], length);
}

//Ex: at+rtc=2-20-06-21,12:10:20
void _fAT_SET_RTC(sData *str_Receiv, uint16_t Pos)
{
	ST_TIME_FORMAT    sRTC_temp = {0};

	if((*(str_Receiv->Data_a8+1)!= '-')||(*(str_Receiv->Data_a8+4)!= '-')|| (*(str_Receiv->Data_a8+7)!= '-') ||
		(*(str_Receiv->Data_a8+10)!= ',')||(*(str_Receiv->Data_a8+13)!= ':')||(*(str_Receiv->Data_a8+16)!= ':'))
	{
		DCU_Response_AT((uint8_t *)"ERROR", 5);
		return;
	}
	else
	{
		sRTC_temp.day   = (*(str_Receiv->Data_a8))-0x30 - 1;
		sRTC_temp.date  = ((*(str_Receiv->Data_a8 + 2))-0x30)*10 + (*(str_Receiv->Data_a8 + 3) - 0x30);
		sRTC_temp.month = ((*(str_Receiv->Data_a8 + 5))-0x30)*10 + (*(str_Receiv->Data_a8 + 6) - 0x30);
		sRTC_temp.year  = ((*(str_Receiv->Data_a8 + 8))-0x30)*10 + (*(str_Receiv->Data_a8 + 9) - 0x30);

		sRTC_temp.hour  = ((*(str_Receiv->Data_a8 + 11))-0x30)*10 + (*(str_Receiv->Data_a8 + 12) - 0x30);
		sRTC_temp.min   = ((*(str_Receiv->Data_a8 + 14))-0x30)*10 + (*(str_Receiv->Data_a8 + 15) - 0x30);
		sRTC_temp.sec   = ((*(str_Receiv->Data_a8 + 17))-0x30)*10 + (*(str_Receiv->Data_a8 + 18) - 0x30);

		if (Check_update_Time(&sRTC_temp) != 1)
		{
			DCU_Response_AT((uint8_t *)"ERROR", 5);
			return;
		} else
		{
			sRTCSet.day     = sRTC_temp.day;
			sRTCSet.date    = sRTC_temp.date;
			sRTCSet.month   = sRTC_temp.month;
			sRTCSet.year    = sRTC_temp.year;

			sRTCSet.hour    = sRTC_temp.hour;
			sRTCSet.min     = sRTC_temp.min;
			sRTCSet.sec     = sRTC_temp.sec;

			Set_RTC(sRTCSet);
			DCU_Response_AT((uint8_t *)"OK", 2);
		}
	}
}

void _fAT_GET_RTC(sData *str_Receiv, uint16_t Pos)
{
    uint8_t length = 0;
    uint8_t aTEMP_RTC[40] = {0};

	aTEMP_RTC[length++] = 'T'; aTEMP_RTC[length++] = 'I'; aTEMP_RTC[length++] = 'M'; aTEMP_RTC[length++] = 'E';
    aTEMP_RTC[length++] = '=';
	aTEMP_RTC[length++] = sRTC.hour / 10 + 0x30;    aTEMP_RTC[length++] = sRTC.hour % 10 + 0x30;    aTEMP_RTC[length++] = ':';
	aTEMP_RTC[length++] = sRTC.min / 10 + 0x30;     aTEMP_RTC[length++] = sRTC.min % 10 + 0x30;     aTEMP_RTC[length++] = ':';
	aTEMP_RTC[length++] = sRTC.sec / 10 + 0x30;     aTEMP_RTC[length++] = sRTC.sec % 10 + 0x30;     aTEMP_RTC[length++] = ';';
    aTEMP_RTC[length++] = 0x0D;
	aTEMP_RTC[length++] = 'D'; aTEMP_RTC[length++] = 'A'; aTEMP_RTC[length++] = 'T'; aTEMP_RTC[length++] = 'E';
    aTEMP_RTC[length++] = '=';
	aTEMP_RTC[length++] = sRTC.day + 0x31;          aTEMP_RTC[length++] = '-';
	aTEMP_RTC[length++] = sRTC.date / 10 + 0x30;    aTEMP_RTC[length++] = sRTC.date % 10 + 0x30;      aTEMP_RTC[length++] = '-';
	aTEMP_RTC[length++] = sRTC.month / 10 + 0x30;   aTEMP_RTC[length++] = sRTC.month % 10 + 0x30;     aTEMP_RTC[length++] = '-';
	aTEMP_RTC[length++] = sRTC.year / 10 + 0x30;    aTEMP_RTC[length++] = sRTC.year % 10 + 0x30;

	DCU_Response_AT(aTEMP_RTC, length);
}

void _fAT_RESET_MODEM(sData *str_Receiv, uint16_t Pos)
{
	DCU_Response_AT((uint8_t *)"OK", 2);
	sFreqInfor.NumWakeup_u8 = 1;
	sFreqInfor.FreqWakeup_u32 = 100;
	Save_Freq_Send_Data();
	#ifdef DEVICE_TYPE_STATION
		sModem.TypeModem_u8 = _LORA_STATION;
	#else
		sModem.TypeModem_u8 = _LORA_NODE_VP;
	#endif
	Save_Device_Type();
    Reset_Chip_Immediately();
}

void _fAT_SET_LED(sData *str_Receiv, uint16_t Pos)
{

}

void _fAT_SET_MODE(sData *str_Receiv, uint16_t Pos)
{
    uint8_t TempMode = 0;
    if (str_Receiv->Length_u16 < (Pos + 1))
    {
        DCU_Response_AT((uint8_t *)"FAIL", 4);
        return;
    }
    TempMode = *(str_Receiv->Data_a8 + Pos++) - 0x30;
    LOG(LOG_INFOR, "Mode: %d", TempMode);
	#ifdef DEVICE_TYPE_STATION
		switch (TempMode)
		{
			case _MODE_SLEEP:
				sModem.Mode = _MODE_SLEEP;
				sModem.SendAll = 1;
				DCU_Response_AT((uint8_t *)"OK", 2);
				USER_Payload_Station_Mode(0);
				sModem.SendAll = 0;
				break;
			case _MODE_WAKEUP:
//				sModem.Mode = _MODE_WAKEUP;
//				DCU_Response_AT((uint8_t *)"OK", 2);
//				UTIL_TIMER_SetPeriod (&TimerLoraTx, sFreqInfor.FreqWakeup_u32 * 1000 * 3);
//				UTIL_TIMER_Stop (&TimerLoraTx);
//				UTIL_TIMER_Start (&TimerLoraTx);
				sModem.Mode = _MODE_WAKEUP;
				sModem.SendAll = 1;
				DCU_Response_AT((uint8_t *)"OK", 2);
				USER_Payload_Station_Mode(0);
				sModem.SendAll = 0;
				sModem.Mode = _MODE_SLEEP;
				break;
			case _MODE_MEASURE:
				sModem.Mode = _MODE_MEASURE;
				DCU_Response_AT((uint8_t *)"OK", 2);
				sModem.SendAll = 1;
				USER_Payload_Station_Mode(0);
				sModem.SendAll = 0;
				sModem.Mode = _MODE_SLEEP;
				break;
			default:
				DCU_Response_AT((uint8_t *)"ERROR", 5);
				break;
		}
	#else
		sModem.Mode = TempMode;
	#endif
}

void _fAT_GET_FIRM_VER(sData *str_Receiv, uint16_t Pos)
{
//    DCU_Response_AT(sFirmVersion.Data_a8, sFirmVersion.Length_u16);
}

void _fAT_GET_AUTHOR(sData *str_Receiv, uint16_t Pos)
{
	DCU_Response_AT((uint8_t *)"Hello, we are the developers of this project.", 45);
	DCU_Response_AT((uint8_t *)"Hanoi University of Science and Technology.", 43);
	DCU_Response_AT((uint8_t *)"Industrial Instrumentation & IoT Laboratory.", 44);
	DCU_Response_AT((uint8_t *)"List of project participants:", 29);
	DCU_Response_AT((uint8_t *)"Project Manager: Nguyen Quang Huy", 33);
	DCU_Response_AT((uint8_t *)"Hardware Designer: Ninh La Van Canh", 35);
	DCU_Response_AT((uint8_t *)"Software Developer: Huy Hung\r\n", 28);
	DCU_Response_AT((uint8_t *)"and me.", 7);
	DCU_Response_AT((uint8_t *)"  ______   _____   _______  _______  _______ ", 45);
	DCU_Response_AT((uint8_t *)" / _____) / ___ \\ /  _____)|__   __||__   __|", 45);
	DCU_Response_AT((uint8_t *)"( (____  / /___\\ \\| |  ___    | |      | |   ", 42);
	DCU_Response_AT((uint8_t *)" \\____ \\ |  ___  || | |__ |   | |      | |   ", 42);
	DCU_Response_AT((uint8_t *)" _____) )| |   | || |___/ | __| |__    | |   ", 42);
	DCU_Response_AT((uint8_t *)"(______/ |_|   |_|\\_______/|_______|   |_|   ", 42);
	DCU_Response_AT((uint8_t *)"/******(C) COPYRIGHT by Bui Viet Duc ******/ ", 42);
	DCU_Response_AT((uint8_t *)"Thank you for everything. Good luck. See you again.", 51);
}












