#ifndef USER_AT_SERIAL_H
#define USER_AT_SERIAL_H

#include "usart.h"
#include "user_util.h"

/* Exported types ------------------------------------------------------------*/
typedef enum
{
	_AT_SET_DEVICE_ID,
	_AT_GET_DEVICE_ID,

	_AT_SET_NETWORK_ID,
	_AT_GET_NETWORK_ID,

	_AT_SET_DUTY_WAKEUP,
	_AT_GET_DUTY_WAKEUP,

	_AT_SET_TYPE_MODEM,
	_AT_GET_TYPE_MODEM,

	_AT_SET_RTC,
	_AT_GET_RTC,

	_AT_RESET_MODEM,
	_AT_SET_LED,
	_AT_SET_MODE,
	_AT_GET_FIRM_VER,
	_AT_GET_AUTHOR,

	_END_AT_CMD,
}Type_Command_AT_PC;

typedef void (*_func_callback_f)(sData *str_Receiv, uint16_t Pos);

typedef struct {
	int 			    idStep;
	_func_callback_f	CallBack;
	sData	    		sTempReceiver;
} struct_CheckList_AT;

/* External variables --------------------------------------------------------*/
extern const struct_CheckList_AT CheckList_AT_CONFIG[];
extern uint8_t      aResPondAT[256];
extern uint8_t      aReceiAT[256];
extern uint16_t     LengthRecei;
extern uint16_t     LengthResPond;

/* Exported functions prototypes ---------------------------------------------*/
void _fAT_SET_DEVICE_ID(sData *str_Receiv, uint16_t Pos);
void _fAT_GET_DEVICE_ID(sData *str_Receiv, uint16_t Pos);

void _fAT_SET_NETWORK_ID(sData *str_Receiv, uint16_t Pos);
void _fAT_GET_NETWORK_ID(sData *str_Receiv, uint16_t Pos);

void _fAT_SET_DUTY_WAKEUP(sData *str_Receiv, uint16_t Pos);
void _fAT_GET_DUTY_WAKEUP(sData *str_Receiv, uint16_t Pos);

void _fAT_SET_TYPE_MODEM(sData *str_Receiv, uint16_t Pos);
void _fAT_GET_TYPE_MODEM(sData *str_Receiv, uint16_t Pos);

void _fAT_SET_RTC(sData *str_Receiv, uint16_t Pos);
void _fAT_GET_RTC(sData *str_Receiv, uint16_t Pos);

void _fAT_RESET_MODEM(sData *str_Receiv, uint16_t Pos);
void _fAT_SET_LED(sData *str_Receiv, uint16_t Pos);
void _fAT_SET_MODE(sData *str_Receiv, uint16_t Pos);
void _fAT_GET_FIRM_VER(sData *str_Receiv, uint16_t Pos);
void _fAT_GET_AUTHOR(sData *str_Receiv, uint16_t Pos);

uint8_t     Check_AT_User(sData *StrUartRecei);

#endif
