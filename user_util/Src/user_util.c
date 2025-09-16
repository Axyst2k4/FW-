#include "user_util.h"
#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include "stm32_systime.h"
#include "main.h"
#include "platform.h"

/* Private variables ---------------------------------------------------------*/
uint32_t        RtCountSystick_u32;
ST_TIME_FORMAT  sRTC;
uint8_t 		(*pFunc_Log_To_Mem) (uint8_t *pData, uint16_t Length); // Func Pointer to Save Log to mem

#ifdef DEVICE_TYPE_STATION
    GPIO_TypeDef *aLED_PORT[LEDn] = {LED_BLUE_GPIO_Port};
    const uint16_t aLED_PIN[LEDn] = {LED_BLUE_Pin};
#else
    GPIO_TypeDef *aLED_PORT[LEDn] = {LED_BLUE_GPIO_Port, LED_GREEN_GPIO_Port};
    const uint16_t aLED_PIN[LEDn] = {LED_BLUE_Pin, LED_GREEN_Pin};
#endif

/* Exported functions --------------------------------------------------------*/
uint8_t Check_Time_Out (uint32_t Millstone_Time, uint32_t Time_Period_ms)
{
	if (Cal_Time(Millstone_Time, RtCountSystick_u32) >= Time_Period_ms)
		return 1;
	return 0;
}

uint8_t Check_Time_Out_2(uint32_t Millstone_Time, uint32_t Time_Period_ms)
{
	if (Millstone_Time == 0)
        return 0;

	if (Cal_Time(Millstone_Time, RtCountSystick_u32) >= Time_Period_ms)
        return 1;

	return 0;
}

uint32_t Cal_Time(uint32_t Millstone_Time, uint32_t Systick_now)
{
	if (Systick_now < Millstone_Time)
		return (0xFFFFFFFF - Millstone_Time + Systick_now);
	return (Systick_now - Millstone_Time);
}

uint32_t Cal_Time_s(uint32_t Millstone_Time, uint32_t Systick_now)
{
	if (Systick_now < Millstone_Time)
		return ((0xFFFFFFFF - Millstone_Time + Systick_now) / 1000);
	return ((Systick_now - Millstone_Time) / 1000);
}

int32_t Convert_float_2int (uint32_t Float_Point_IEEE, uint8_t scale)
{
	int 		scaleVal = 1;
	float 		floatTmp = 0;
	uint8_t		i = 0;

	//Get scale value
	for (i = 0; i < scale; i++)
	{
		scaleVal *= 10;
	}
	floatTmp = (float) Convert_FloatPoint_2Float(Float_Point_IEEE);
	return (int32_t) (floatTmp * scaleVal);
}

float Convert_FloatPoint_2Float (uint32_t uintValue)
{
    union {
        uint32_t intValue;
        float floatValue;
    } conversion;

    conversion.intValue = uintValue;
    return conversion.floatValue;
}

int32_t Convert_uint_2int (uint32_t Num)
{
	return *((int32_t*)(&Num));
}

int16_t Convert_uint16_2int16 (uint16_t Num)
{
	return *((int16_t*)(&Num));
}

int64_t Convert_uint64_2int64 (uint64_t Num)
{
	return *((int64_t*)(&Num));
}

uint8_t BBC_Cacul (uint8_t* Buff, uint16_t length)
{
	uint16_t i = 0;
	uint8_t Result = 0;
	for (i = 0; i < length; i++)
		Result ^= *(Buff + i);
	return Result;
}

uint8_t Check_BBC (sData* Str)
{
	uint8_t BBC_Value;
	BBC_Value = BBC_Cacul((Str->Data_a8 + 1), (Str->Length_u16 - 2));
	if (BBC_Value == *(Str->Data_a8 + Str->Length_u16 - 1))
        return 1;
	else
        return 0;
}

void Convert_Uint64_To_StringDec (sData *Payload, uint64_t Data, uint8_t Scale)
{
    uint16_t    i = 0;
    uint8_t     PDu = 0;
    uint8_t     Temp = 0;
    uint8_t     BufStrDec[30] = {0};
    sData    StrDecData = {&BufStrDec[0], 0};
    if (Data == 0)
    {
        *(Payload->Data_a8 + Payload->Length_u16) = '0';
        Payload->Length_u16++;
        return;
    }
    while (Data != 0)
    {
        PDu = (uint8_t) (Data % 10);
        Data = Data / 10;
        *(StrDecData.Data_a8 + StrDecData.Length_u16++) = PDu + 0x30;
    }
    for (i = 0; i < (StrDecData.Length_u16 / 2); i++)
    {
        Temp = *(StrDecData.Data_a8 + StrDecData.Length_u16 - i - 1);
        *(StrDecData.Data_a8 + StrDecData.Length_u16 - i - 1) = *(StrDecData.Data_a8 + i);
        *(StrDecData.Data_a8 + i) = Temp;
    }
    Scale_String_Dec (&StrDecData, Scale);
    for (i = 0; i < StrDecData.Length_u16; ++i)
		*(Payload->Data_a8 +Payload->Length_u16 + i) = *(StrDecData.Data_a8 + i);
	Payload->Length_u16 +=  StrDecData.Length_u16;
}

void Scale_String_Dec (sData *StrDec, uint8_t Scale)
{
    uint16_t    i = 0;
    uint8_t     aRESULT[20] = {0};
    uint8_t     Length = 0;
    uint8_t     NumZero = 0, NumNguyen = 0;
    uint8_t     TempLength = 0;
    if (((StrDec->Length_u16 == 1) && (*(StrDec->Data_a8) == 0x30)) || (Scale == 0))
        return;
    if (StrDec->Length_u16 <= Scale)
    {
        aRESULT[Length++] = '0';
        aRESULT[Length++] = '.';
        NumZero = Scale - StrDec->Length_u16;   //So luong so '0' them vao phia sau dau ','
        //Them cac so 0 sau dau ','
        for (i = 0; i < NumZero; i++)
            aRESULT[Length++] = '0';
        //Them tiep cac byte strdec.
        for (i = 0; i < StrDec->Length_u16; i++)
             aRESULT[Length++] = *(StrDec->Data_a8 + i);
    } else
    {
        NumNguyen = StrDec->Length_u16 - Scale;
        //Copy phan nguyen vao
        for (i = 0; i < NumNguyen; i++)
            aRESULT[Length++] = *(StrDec->Data_a8 + i);
        //
        aRESULT[Length++] = '.';
        //Copy phan thap phan vao
        for (i = NumNguyen; i < StrDec->Length_u16; i++)
            aRESULT[Length++] = *(StrDec->Data_a8 + i);
        //
    }
    TempLength = Length;
    //Neu co so '0' phia sau cung thi bo qua het
    for (i = (TempLength - 1); i > 0; i--)
    {
        //Cho den khi co so khac '0' se break;
        if (aRESULT[i] != '0')
        {
            if (aRESULT[i] == '.')   //'.'
                Length--;

			break;
        }
        if (aRESULT[i] == '0')
            Length--;
    }
    //Ket qua thu duoc trong buff aRESULT chieu dai length-> Copy sang strdec dâu vao làm dau ra
    Reset_Buff (StrDec);
    for (i = 0; i < Length; i++)
        *(StrDec->Data_a8 + StrDec->Length_u16++) = aRESULT[i];
}

void Convert_Int64_To_StringDec (sData *Payload, int64_t Data, uint8_t Scale)
{
    uint8_t     i = 0;
    uint8_t     BufStrDec[30] = {0};
    uint8_t     Sign = 0;
    sData    StrDecData = {&BufStrDec[0], 0};
    if (Data < 0)
    {
        Sign = 1;
        Data = 0 - Data;
    }
    Convert_Uint64_To_StringDec(&StrDecData, (uint64_t)Data, Scale);
    if (*(StrDecData.Data_a8 + StrDecData.Length_u16) != '0')
    {
        if (Sign == 1)
        {
            for (i = 0; i < StrDecData.Length_u16; i++)
              *(StrDecData.Data_a8 + StrDecData.Length_u16 - i) =  *(StrDecData.Data_a8 + StrDecData.Length_u16 - i - 1);

            *(StrDecData.Data_a8) = '-';
            StrDecData.Length_u16 ++;
        }
    }
    for (i = 0; i < StrDecData.Length_u16; ++i)
		*(Payload->Data_a8 +Payload->Length_u16 + i) = *(StrDecData.Data_a8 + i);

	Payload->Length_u16 +=  StrDecData.Length_u16;
}

void Reset_Buff(sData *str)
{
	uint16_t i;
	for (i = 0; i < str->Length_u16; i++)
		*(str->Data_a8 +i ) = 0;
	str->Length_u16 = 0;
}



uint32_t Convert_String_To_Dec(uint8_t *pData, uint8_t lenData)
{
    uint8_t     index = 0;
    uint8_t     tempData = 0;
    uint32_t    reVal = 0;
    for (index = 0; index < lenData; index++)
    {
        if (('0' <= *(pData + index)) && (*(pData + index) <= '9'))
        {
            tempData = (*(pData + index) - 0x30);
        } else
            tempData = 0;

        if (index == 0)
            reVal = tempData;
        else
            reVal = (reVal * 10) + tempData;
    }
    return reVal;
}

void Convert_Hex_To_String_Hex(sData *sTaget, sData *sSource)
{
    uint8_t 	Temp_1 = 0;
    uint8_t 	Temp_2 = 0;
    uint16_t 	i = 0;
    for (i = 0; i < sSource->Length_u16; i++)
    {
        //Convert 4 bit dau
        Temp_1 = ((*(sSource->Data_a8 + i)) >> 4) & 0x0F;
        if (Temp_1 <= 9)
        	*(sTaget->Data_a8 + 2*i) = Temp_1 + 0x30;
        else
        	*(sTaget->Data_a8 + 2*i) = Temp_1 + 0x37;
        //Convert 4 bit sau
        Temp_2 = ((*(sSource->Data_a8 + i)) & 0x0F);
        if (Temp_2 <= 9)
        	*(sTaget->Data_a8 + 2*i + 1) = Temp_2 + 0x30;
        else
        	*(sTaget->Data_a8 + 2*i + 1) = Temp_2 + 0x37;
    }
    //Length gap doi source
    sTaget->Length_u16 = sSource->Length_u16 * 2;
}

void UTIL_MEM_set( void *dst, uint8_t value, uint16_t size )
{
    uint8_t* dst8= (uint8_t *) dst;
    while( size-- )
    {
        *dst8++ = value;
    }
}


void Convert_String_Hex_To_Hex (sData *sSource, int Pos_Begin, sData *sTarget, uint16_t MaxLength)
{
	uint8_t Temp_Data = 0;
	uint8_t Temp_Data2 = 0;
	int Pos_Convert = Pos_Begin;
	while (Pos_Convert < sSource->Length_u16)
	{
		 Temp_Data = *(sSource->Data_a8 + Pos_Convert++);
         Temp_Data = Convert_String_To_Hex (Temp_Data);
		 Temp_Data2 = *(sSource->Data_a8 + Pos_Convert++);
         Temp_Data2 = Convert_String_To_Hex (Temp_Data2);
         //Add byte to target
		 *(sTarget->Data_a8 + sTarget->Length_u16++) = Temp_Data * 16 + Temp_Data2;;
         //Max target return
         if (sTarget->Length_u16 == MaxLength)
             return;
	}
}

uint8_t Convert_String_To_Hex (uint8_t NumString)
{
    if (NumString < 0x3A)
        return (NumString - 0x30);
    else if (NumString < 0x61)
        return (NumString - 0x37);
    else
        return (NumString - 0x57);
}

uint8_t Convert_Hex_To_StringHex (uint8_t Hex)
{
    return ((Hex /10) *16 + (Hex %10));
}

void LOG(log_level_t level, const char* message, ...){
	va_list args;
	va_start(args, message);
	char buffer[LOG_BUFFER_SIZE];
	vsnprintf(buffer, LOG_BUFFER_SIZE, message, args);
	va_end(args);
	SysTime_t curtime = SysTimeGet();
	uint16_t second = curtime.Seconds % 1000;
	const char* level_prefix = "";
	const char* level_afterfix = "\r\n";
	switch (level){
		case LOG_ERROR:
			level_prefix = "[ERROR]:";
			break;
		case LOG_DEBUG:
			level_prefix = "[DEBUG]:";
			break;
		case LOG_TRANS:
			level_prefix = "[TRANS]:";
			break;
		case LOG_RECEI:
			level_prefix = "[RECEI]:";
			break;
		case LOG_INFOR:
			level_prefix = "[INFOR]:";
			break;
		default:
			break;
	}
	char log_message[LOG_BUFFER_SIZE + 16];
	snprintf(log_message, sizeof(log_message), "%03ds%03d: %s %s %s", second, curtime.SubSeconds, level_prefix, buffer, level_afterfix);
	HAL_UART_Transmit(&uart_debug, (uint8_t*) log_message, strlen(log_message), LOG_TIMEOUT);
}

void LOG_Array(log_level_t level, uint8_t *pData, uint16_t Length, const char* message, ...){
	va_list args;
	va_start(args, message);
	char buffer_mess[LOG_BUFFER_SIZE];
	vsnprintf(buffer_mess, LOG_BUFFER_SIZE, message, args);
	va_end(args);
	SysTime_t curtime = SysTimeGet();
	uint16_t second = curtime.Seconds % 1000;
	const char* level_prefix = "";
	switch (level){
		case LOG_ERROR:
			level_prefix = "[ERROR]:";
			break;
		case LOG_DEBUG:
			level_prefix = "[DEBUG]:";
			break;
		case LOG_TRANS:
			level_prefix = "[TRANS]:";
			break;
		case LOG_RECEI:
			level_prefix = "[RECEI]:";
			break;
		case LOG_INFOR:
			level_prefix = "[INFOR]:";
			break;
		default:
			break;
	}
	char log_message[LOG_BUFFER_SIZE + 16];
	snprintf(log_message, sizeof(log_message), "%03ds%03d: %s %s", second, curtime.SubSeconds, level_prefix, buffer_mess);
	HAL_UART_Transmit(&uart_debug, (uint8_t*) log_message, strlen(log_message), LOG_TIMEOUT);

	uint8_t buffer[LOG_BUFFER_SIZE];
	sData sSoucre = {&pData[0], Length * 2};
	sData sTarget = {&buffer[0], LOG_BUFFER_SIZE};
	Convert_Hex_To_String_Hex(&sTarget, &sSoucre);
	HAL_UART_Transmit(&uart_debug, buffer, Length * 2, LOG_TIMEOUT);
    HAL_UART_Transmit(&uart_debug, (uint8_t*)"\r\n" , 2, LOG_TIMEOUT);
}

void LED_ON (eLed_TypeDef Led)
{
	HAL_GPIO_WritePin(aLED_PORT[Led], aLED_PIN[Led], GPIO_PIN_RESET);
}

void LED_OFF (eLed_TypeDef Led)
{
    HAL_GPIO_WritePin(aLED_PORT[Led], aLED_PIN[Led], GPIO_PIN_SET);
}

void LED_TOGGLE (eLed_TypeDef Led)
{
    HAL_GPIO_TogglePin(aLED_PORT[Led], aLED_PIN[Led]);
}
/* End of file ----------------------------------------------------------------*/
