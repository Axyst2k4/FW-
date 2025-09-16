#include "stm32l0xx_hal.h"
#include "stm32l0xx.h"

#include "user_uart.h"

#ifndef USER_UTIL_H
#define USER_UTIL_H

#define FLASH_BYTE_WRTIE	4
#define FLASH_BYTE_EMPTY    0x00

/* Define --------------------------------------------------------------------*/
#define TRUE 	        1
#define FALSE 	        0
#define PENDING	        2

#define true			1
#define false			0

#define DEBUG_AT_SIM    0                   //1: disable;    0 la able
#define DEBUG_MODE      0                   //1: khong Cho print ra Uart1;  0: alow

#if (DEBUG_MODE == 0)
    #define PrintDebug(...)  				HAL_UART_Transmit(__VA_ARGS__)
#else
    #define PrintDebug(...)
#endif

#define UTILS_INIT_CRITICAL_SECTION()

/**
  * @brief macro used to enter the critical section
  */
#define UTILS_ENTER_CRITICAL_SECTION() uint32_t primask_bit= __get_PRIMASK();\
  __disable_irq()

/**
  * @brief macro used to exit the critical section
  */
#define UTILS_EXIT_CRITICAL_SECTION()  __set_PRIMASK(primask_bit)

/* Exported types ------------------------------------------------------------*/
//typedef struct
//{
//	uint8_t			*Data_a8;					// string
//	uint16_t		Length_u16;
//} sData;

#define LOG_BUFFER_SIZE 				300
#define LOG_TIMEOUT     				10000

typedef enum {
	LOG_ERROR,
	LOG_DEBUG,
	LOG_TRANS,
	LOG_RECEI,
	LOG_INFOR
} log_level_t;

typedef enum
{
    __LED_MODE,
    __LED_MEASURE,
}eLed_TypeDef;

typedef struct
{
	uint8_t hour;  // read hour
	uint8_t min;   // read minute
	uint8_t sec;   // read second
    uint8_t day;   // read day
    uint8_t date;  // read date
    uint8_t month; // read month
    uint8_t year;  // read year
    uint32_t SubSeconds;
} ST_TIME_FORMAT;

extern uint8_t (*pFunc_Log_To_Mem) (uint8_t *pData, uint16_t Length);

/* External variables --------------------------------------------------------*/
extern uint32_t        RtCountSystick_u32;
extern ST_TIME_FORMAT  sRTC;

/* Exported functions prototypes ---------------------------------------------*/
uint32_t        Cal_Time(uint32_t Millstone_Time, uint32_t Systick_now);
uint32_t        Cal_Time_s(uint32_t Millstone_Time, uint32_t Systick_now);
uint8_t         Check_Time_Out(uint32_t Millstone_Time, uint32_t Time_Period_ms);
uint8_t         Check_Time_Out_2(uint32_t Millstone_Time, uint32_t Time_Period_ms);

float           Convert_FloatPoint_2Float (uint32_t Float_Point);
int32_t         Convert_float_2int (uint32_t Float_Point_IEEE, uint8_t scale);
int32_t         Convert_uint_2int (uint32_t Num);

void            Scale_String_Dec (sData *StrDec, uint8_t Scale);
int16_t         Convert_uint16_2int16 (uint16_t Num);
int64_t         Convert_uint64_2int64 (uint64_t Num);
uint8_t 		BBC_Cacul (uint8_t* Buff, uint16_t length);
uint8_t 		Check_BBC (sData* Str);

void            Reset_Buff(sData *str);
void            Convert_Int64_To_StringDec (sData* Payload, int64_t Data, uint8_t Scale);
void            Convert_Uint64_To_StringDec (sData* Payload, uint64_t Data, uint8_t Scale);
void 			Convert_Hex_To_String_Hex(sData *sTaget, sData *sSource);
void            Convert_String_Hex_To_Hex (sData *sSource, int Pos_Begin, sData *sTarget, uint16_t MaxLength);
uint8_t         Convert_String_To_Hex (uint8_t NumString);
uint32_t        Convert_String_To_Dec(uint8_t *pData, uint8_t lenData);

void            UTIL_MEM_set( void *dst, uint8_t value, uint16_t size );
uint8_t         Convert_Hex_To_StringHex (uint8_t Hex);
void 			LOG(log_level_t level, const char* message, ...);
void 			LOG_Array(log_level_t level, uint8_t *pData, uint16_t Length, const char* message, ...);

void 			LED_ON (eLed_TypeDef Led);
void 			LED_OFF (eLed_TypeDef Led);
void 			LED_TOGGLE (eLed_TypeDef Led);
#endif	/* USER_UTIL_H */
