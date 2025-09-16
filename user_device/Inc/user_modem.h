#ifndef USER_MODEM_H
#define USER_MODEM_H

#include "user_internal_mem.h"
#include "user_lpm.h"
#include "user_util.h"
#include "stm32_systime.h"

/* Define --------------------------------------------------------------------*/
#define MAX_DCU_ID_LENGTH	    20
#define MAX_NET_ID_LENGTH	    20

#define VDD_INTERNAL_MAX        3600
#define VDD_INTERNAL_MIN        2800

#define LEGNTH_AT_SERIAL        256
#define LENGTH_MULTI_TX			300

/* Exported types ------------------------------------------------------------*/
typedef enum
{
    _LORA_NODE_VNA,
	_LORA_NODE_VP,
	_LORA_STATION,
} Type_Mark_DCU;

typedef enum
{
	_MODE_SLEEP = 0,
    _MODE_WAKEUP = 1,
	_MODE_MEASURE = 2,
} eModeNodeLoRa;

typedef struct
{
	sData  			sDCU_id;
	sData			sNET_id;
	// Variable
	sData 			sPayload;
	uint8_t			TypeModem_u8;		            //loai DCU
	uint8_t			Mode;

	sData			sBackup;
	uint8_t			bNeedConfirm;
	uint8_t			TypeDataMessage;
	uint8_t			TimeTrySendAgain;

	SysTime_t		RxTimeBefore, RxTimeAfter;
    sData           strATCmd;

    uint32_t        TimeDelayTx_u32;
    uint32_t		TimeDelaySingle_u32;
    uint32_t		TimeDelayCalib_u32;
    uint32_t		TimeDelayNetwork_u32;

    uint8_t         SendAll;
}Struct_Modem_Variable;

typedef struct
{
    uint8_t			NumWakeup_u8;                //So lan lay mau roi gui ban tin: Che do SAVE_MODE
    uint16_t        FreqWakeup_u32;              //Chu ki thuc day
}SModemFreqActionInformation;

/* External variables --------------------------------------------------------*/
extern Struct_Modem_Variable			sModem;
extern ST_TIME_FORMAT           		sRTCSet;

extern StructManageRecordFlash  		sRecSingle;
extern StructManageRecordFlash  		sRecMultiple;
extern StructManageRecordFlash  		sRecMessage;

extern SModemFreqActionInformation     	sFreqInfor;
extern StructpFuncLPM           		sModemLPMHandler;

// Extern Buffer
extern uint8_t aDCU_ID[MAX_DCU_ID_LENGTH];
extern uint8_t aNET_ID[MAX_DCU_ID_LENGTH];
extern uint8_t aMULTI_MESS [LENGTH_MULTI_TX];

/* Exported functions prototypes ---------------------------------------------*/
void 		Reset_Chip_Immediately (void);
void 		DCU_Response_AT(uint8_t *data, uint16_t length);

void        Modem_Deinit_Peripheral (void);
void        Modem_Init_Peripheral (void);
void        Modem_Init_Before_IRQ_Handle (void);
void        Modem_Deinit_Before_IRQ_Handle (void);

void        MX_GPIO_DeInit(void);
void        Modem_Init_Gpio_Again(void);

void 		Init_Memory_Infor(void);

void 		Init_ID(uint8_t type);
void 		Save_ID(uint8_t type);

void        Init_Timer_Send (void);
void        Init_Index_Packet (void);
void        Save_Freq_Send_Data (void);

void        Init_Device_Type (void);
void        Save_Device_Type (void);

#endif /* USER_MODEM_H */
