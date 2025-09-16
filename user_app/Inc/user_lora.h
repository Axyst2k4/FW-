#ifndef USER_LORA_H
#define USER_LORA_H

#include "radio_board_if.h"
#include "user_adc.h"
#include "user_define.h"
#include "user_protocol.h"
#include "user_event_drive.h"
#include "user_util.h"

/* Define --------------------------------------------------------------------*/
#define USING_APP_LORA

#ifdef DEVICE_TYPE_STATION
    #define RX_TIMEOUT_VALUE                3650000
    #define TX_TIMEOUT_VALUE                10000
#else
    #define RX_TIMEOUT_VALUE                2000
    #define TX_TIMEOUT_VALUE                5500
	#define RX_TIMEOUT_VALUE_ACTIVE			3650000
#endif

#define TIME_RETRY_SEND_CONFIRM             5000

/*============== RF module ==============*/
#define USE_MODEM_LORA  1
#define USE_MODEM_FSK   0

#define RF_FREQUENCY                                915000000 /* Hz */
#define TX_OUTPUT_POWER                             19        /* dBm */

#define LED_PERIOD_MS   500

#if (( USE_MODEM_LORA == 1 ) && ( USE_MODEM_FSK == 0 ))
	#define LORA_BANDWIDTH                              0         /* [0: 125 kHz, 1: 250 kHz, 2: 500 kHz, 3: Reserved] */
	#define LORA_SPREADING_FACTOR                       10         /* [SF7..SF12] */
	#define LORA_CODINGRATE                             1         /* [1: 4/5, 2: 4/6, 3: 4/7, 4: 4/8] */
	#define LORA_PREAMBLE_LENGTH                        8         /* Same for Tx and Rx */
	#define LORA_SYMBOL_TIMEOUT                         5         /* Symbols */
	#define LORA_FIX_LENGTH_PAYLOAD_ON                  false
	#define LORA_IQ_INVERSION_ON                        false
#elif (( USE_MODEM_LORA == 0 ) && ( USE_MODEM_FSK == 1 ))
	#define FSK_FDEV                                    25000     /* Hz */
	#define FSK_DATARATE                                50000     /* bps */
	#define FSK_BANDWIDTH                               50000     /* Hz */
	#define FSK_PREAMBLE_LENGTH                         5         /* Same for Tx and Rx */
	#define FSK_FIX_LENGTH_PAYLOAD_ON                   false
#else
	#error "Please define a modem in the compiler subghz_phy_app.h."
#endif /* USE_MODEM_LORA | USE_MODEM_FSK */

/* Exported types ------------------------------------------------------------*/
typedef enum
{
	RX,
	RX_TIMEOUT,
	RX_ERROR,
	TX,
	TX_TIMEOUT,
} States_t;

/* External variables --------------------------------------------------------*/
typedef enum
{
	_EVENT_LORA_TX,
	_EVENT_LORA_IRQ,
    _EVENT_LORA_LED,
    _EVENT_LORA_END,
}sTypeEventLora;

typedef struct
{
    int8_t          Rssi_u8;
    int8_t          Snr_u8;

    sData           sRecv;
    uint8_t         NewMessType_u8;

    LoRaFrame_t     sFrameRx;
    sData           sIntanData;
}StructLoraManager;

typedef struct
{
    uint8_t         rAtcmd_u8;              // Mark Last config Server
    uint8_t         aDATA_CONFIG[256];   	//buff chua last Data config server
    uint8_t         LengthConfig_u8;      	//Length
}StructLoraHandle;

extern StructLoraManager    sLoraVar;
extern sEvent_struct        sEventAppLora[];
extern StructLoraHandle     shLora;

/*===================== Function =========================*/
void        AppLora_Init(void);
uint8_t     AppLora_Send (uint8_t *pData, uint8_t Length, uint8_t MessType, uint8_t DataType, uint32_t delay);
uint8_t     AppLora_Task(void);
uint8_t     AppLora_Check_New_Mess_Of_Device (void);
void 		AppLora_Set_Tx_Again (uint32_t Time);

void        AppLora_Deinit_IO_Radio (void);
void        AppLora_Init_IO_Radio (void);

#endif	/* USER_LORA_H */
