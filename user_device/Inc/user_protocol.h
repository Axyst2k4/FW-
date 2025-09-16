#ifndef USER_PROTOCOL_H
#define USER_PROTOCOL_H

#include "user_util.h"

/* Exported struct -----------------------------------------------------------*/
typedef union uLoRaHeader
{
    uint8_t Value;
    struct sHeaderBits
    {
        uint8_t RespondType_u8  : 3;
        uint8_t DataType_u8     : 3;
        uint8_t ACK_u8			: 1;
        uint8_t SendAll	        : 1;
    }Bits;
}LoRaHeader_t;

typedef struct sLoRaFrame
{
	LoRaHeader_t 	Header;
    uint32_t 		DevAddr;
    uint32_t 		NetAddr;
}LoRaFrame_t;

typedef enum eLoRaRespondType
{
    DATA_UNCONFIRMED_UP   = 0x01,	// Node -> Station: ko can gui ACK xac nhan
    DATA_UNCONFIRMED_DOWN = 0x02,	// Station -> Node: ko can gui ACK xac nhan
    DATA_CONFIRMED_UP     = 0x03,	// Node -> Station: can gui ACK
    DATA_CONFIRMED_DOWN   = 0x04,	// Station -> Node: can gui ACK
}LoRaRespondType_t;

typedef struct
{
    uint8_t CtrlACK_u8;
}StructControlLora;

extern StructControlLora        sCtrlLora;

/* Exported functions prototypes ---------------------------------------------*/
uint8_t Protocol_Extract_Rx (uint8_t *pData, uint8_t Length, uint8_t NoProcess, LoRaFrame_t *sFrameRx);
uint8_t Protocol_Process_Rx (uint8_t DataType, uint8_t *pData, uint8_t Length);

uint8_t Protocol_Packet_Header (LoRaFrame_t *pFrame, uint8_t MessType, uint8_t DataType);

#endif


